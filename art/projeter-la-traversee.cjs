// Depuis la racine : node art/projeter-la-traversee.cjs [--format portrait|large] [--sortie dossier]
// Les options --planches, --stations, --ouverture et --film limitent la prise à ces éléments.
// Pour préparer les outils après npm ci : npm install --no-save --package-lock=false esbuild playwright
// Installer Chromium avec npx playwright install chromium et fournir ffmpeg dans le PATH.
// MESTIER_CHROMIUM peut désigner un navigateur installé. MESTIER_ESBUILD et MESTIER_PLAYWRIGHT
// acceptent le chemin vers des modules installés séparément du site.
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const http = require("node:http");
const os = require("node:os");
const { spawn } = require("node:child_process");
const { createHash } = require("node:crypto");
const { pipeline } = require("node:stream/promises");
const { Readable } = require("node:stream");
const sharp = require("sharp");
const esbuild = require(process.env.MESTIER_ESBUILD || "esbuild");
const { chromium } = require(process.env.MESTIER_PLAYWRIGHT || "playwright");

const repo = path.resolve(__dirname, "..");
const source = path.join(repo, "components/traversee/scene/TravellingScene.tsx");
const args = process.argv.slice(2);
const option = flag => args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined;
const destination = path.resolve(option("--sortie") || path.join(repo, "public/traversee"));
const formats = {
  large: { still: [1440, 900], movie: [960, 600] },
  portrait: { still: [540, 1170], movie: [438, 948] }
};
const roughCut = args.includes("--rushes");
if (roughCut && !option("--sortie")) throw Error("Les rushes demandent un dossier --sortie dédié.");
const chosenFormat = option("--format");
if (chosenFormat && !(chosenFormat in formats)) throw Error("Le format doit être large ou portrait.");
const tasks = ["planches", "stations", "ouverture", "film"].filter(name => args.includes("--" + name));
const wants = name => !tasks.length || tasks.includes(name);
const stations = [
  ["invitation",.06],["impression",.23],["portique",.41],
  ["scene",.59],["trace",.77],["correspondance",.95]
];
const frameName = n => "frame-" + String(n).padStart(3, "0") + ".webp";

async function startServer() {
  const content = `
    import { createRoot } from "react-dom/client";
    import TravellingScene from ${JSON.stringify(source)};
    const progress = {current: Math.min(1, Math.max(0, Number(new URLSearchParams(location.search).get("pose")) || 0))};
    window.go = p => {progress.current = p; window.dispatchEvent(new Event("mestier:travelling"));};
    const ready = () => { document.body.dataset.ready = "true"; };
    const failed = () => { document.body.dataset.failed = "true"; };
    createRoot(document.querySelector("main")).render(
      <TravellingScene progress={progress} active={true} onReady={ready} onFailure={failed} />
    );
  `;
  const built = await esbuild.build({
    stdin: {contents: content, loader: "tsx", resolveDir: repo},
    bundle: true, write: false, jsx: "automatic", format: "iife", minify: true,
    target: "chrome120",
    define: {"process.env.NODE_ENV": '"production"', "process.env.NEXT_PUBLIC_BASE_PATH": '""'}
  });
  const html = '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}html,body,main,canvas{margin:0;width:100%;height:100%;display:block;overflow:hidden}body{background:#111414}</style></head><body><main></main><script src="/moteur.js"></script></body></html>';
  const publicDir = path.join(repo, "public");
  const server = http.createServer((req,res) => {
    const pathname = new URL(req.url, "http://localhost").pathname;
    if (pathname === "/") {
      res.writeHead(200, {"Content-Type": "text/html; charset=utf-8"}).end(html);
    } else if (pathname === "/moteur.js") {
      res.writeHead(200, {"Content-Type": "text/javascript"}).end(built.outputFiles[0].contents);
    } else {
      const file = path.resolve(publicDir, "." + decodeURIComponent(pathname));
      if (!file.startsWith(publicDir + path.sep) || !fs.statSync(file, {throwIfNoEntry: false})?.isFile()) {
        res.writeHead(404).end();
        return;
      }
      const type = {".webp":"image/webp", ".jpg":"image/jpeg", ".png":"image/png", ".woff2":"font/woff2"}[path.extname(file)];
      res.writeHead(200, {"Content-Type": type || "application/octet-stream"});
      fs.createReadStream(file).pipe(res);
    }
  });
  await new Promise((resolve,reject) => server.once("error",reject).listen(Number(option("--port") || 0),"127.0.0.1",resolve));
  return server;
}

async function canvasView(browser, url, dimensions, portrait, requireFinalModels = true) {
  const [width,height] = dimensions;
  const page = await browser.newPage({
    viewport: {width,height}, screen: {width,height}, deviceScaleFactor: 1,
    isMobile: portrait, hasTouch: portrait, locale: "fr-FR"
  });
  let exception;
  const assetErrors=[];
  page.on("pageerror", error => { exception = error; });
  page.on("response", response=>{
    const name=new URL(response.url()).pathname;
    if (response.status()>=400 && /^\/(matieres|traversee)\//.test(name)) assetErrors.push(name);
  });
  await page.goto(url, {waitUntil:"commit",timeout:90000});
  await page.waitForFunction(finalModels => {
    const scene = document.querySelector("canvas")?.dataset;
    return document.body.dataset.failed || (
      document.body.dataset.ready && scene?.materials === "ready" &&
      (!finalModels || (scene.models === "cachet,presse" && scene.engraving === "ready" &&
        scene.light === "studio" && scene.textile === "ready"))
    );
  }, requireFinalModels, {timeout:90000}).catch(async error=>{
    const state=await page.locator("canvas").evaluate(c=>({...c.dataset})).catch(()=>null);
    throw Error("La scène est restée en attente : " + JSON.stringify({state,assetErrors,reason:exception?.message || error.message}));
  });
  if (requireFinalModels && assetErrors.length) throw Error("Ressources indisponibles : " + assetErrors.join(", "));
  if (exception) throw exception;
  if (await page.locator("body").getAttribute("data-failed")) throw Error("La scène 3D a échoué.");
  const cdp = await page.context().newCDPSession(page);
  return {
    async shoot(progress, lossless) {
      await page.evaluate(async position => {
        window.go(position);
        const started = performance.now();
        while (true) {
          await new Promise(resolve => requestAnimationFrame(resolve));
          const frame = document.querySelector("canvas");
          if (Math.abs(Number(frame?.dataset.pose) - position) < 0.000065) break;
          if (performance.now() - started > 9000) throw Error("Pose indisponible à " + position + " / " + frame?.dataset.pose);
        }
      }, progress);
      const result = await cdp.send("Page.captureScreenshot", {
        format: lossless ? "png" : "jpeg", ...(lossless ? {} : {quality: 92}),
        fromSurface: true, captureBeyondViewport: false, optimizeForSpeed: true
      });
      if (exception) throw exception;
      return Buffer.from(result.data, "base64");
    },
    async resize(width,height) {
      await page.setViewportSize({width,height});
      await page.waitForFunction(([w,h])=>{
        const c=document.querySelector("canvas");
        return c?.clientWidth===w && c.clientHeight===h;
      },[width,height]);
    },
    async readSeal() {
      return page.locator("canvas").evaluate(c=>({x:Number(c.dataset.sealX),y:Number(c.dataset.sealY)}));
    },
    async close() {await page.close();}
  };
}

async function printSheets(view,stage,format) {
  for (let i=0; i<=30; i++) {
    const image = await view.shoot(i/30,true);
    if (i===0) console.log(format,"centre du cachet",await view.readSeal());
    // The first print doubles as the first screen while the initial film is decoded.
    await sharp(image).webp({quality: i === 0 ? 87 : 83, effort: 5, smartSubsample: true}).toFile(path.join(stage,frameName(i)));
  }
  // Both editorial folios show a landscape print, even in the mobile layout.
  // Reframe the station for the plate so the whole envelope and seal remain in view.
  if (format === "portrait") await view.resize(...formats.large.still);
  const letter = await view.shoot(.895,true);
  const crop = format === "portrait"
    ? {left:619,top:252,width:763,height:360}
    : {left:576,top:180,width:835,height:570};
  await sharp(letter).extract(crop).webp({quality:88,effort:5,smartSubsample:true}).toFile(path.join(stage,"lettre.webp"));
}

async function printStations(view,stage) {
  for (const [name,pose] of stations) {
    const image=await view.shoot(pose,true);
    await sharp(image).webp({quality:87,effort:5,smartSubsample:true}).toFile(path.join(stage,name+".webp"));
  }
}

const movies = {
  ouverture: {
    filename:"ouverture.mp4", fps:30, count:63, gop:15,
    position: i => {
      const t = i / 62;
      return 0.06 * t * t * (3 - 2 * t);
    }
  },
  film: {filename:"plan-sequence.mp4", fps:24, count:241, gop:6, position: i => i/240}
};

async function record(view, stage, mode, format) {
  const spec = movies[mode];
  const target = path.join(stage,spec.filename);
  const encoder = spawn("ffmpeg", [
    "-nostdin","-v","error","-y","-f","image2pipe","-framerate",String(spec.fps),
    "-vcodec","png","-i","pipe:0","-an","-c:v","libx264","-profile:v","high",
    "-vf","scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p",
    "-pix_fmt","yuv420p","-preset","medium","-crf",mode === "ouverture" ? "19" : "22",
    "-threads","2","-filter_threads","1","-x264-params",`keyint=${spec.gop}:min-keyint=${spec.gop}:scenecut=0`,
    "-color_primaries","bt709","-color_trc","bt709","-colorspace","bt709",
    "-movflags","+faststart",target
  ], {stdio:["pipe","ignore","inherit"]});
  const ended = new Promise((resolve,reject) => {
    encoder.once("error",reject);
    encoder.once("close",code => code === 0 ? resolve() : reject(new Error("FFmpeg s’est arrêté avec le code " + code)));
  });
  async function* frames() {
    for (let i=0; i<spec.count; i++) {
      yield await view.shoot(spec.position(i),true);
    }
  }
  try { await Promise.all([ended, pipeline(Readable.from(frames()),encoder.stdin)]); }
  finally { if (encoder.exitCode === null) encoder.kill(); }
  const opening = mode === "ouverture";
  if (!opening && format !== "portrait") return;
  // Longer groups reduce the network transfer for the forward-only opening.
  // The mobile projection preserves the six-frame seek interval for scrubbing.
  const compact = path.join(stage,mode+"-compact.mp4");
  const prediction = opening ? "keyint=45:min-keyint=15:scenecut=0" : "keyint=6:min-keyint=6:scenecut=0";
  const delivery = spawn("ffmpeg",[
    "-nostdin","-v","error","-y","-i",target,"-an","-c:v","libx264","-threads",opening ? "2" : "1",
    "-preset","slow","-crf",opening ? "23" : "24","-x264-params",prediction,
    "-pix_fmt","yuv420p","-movflags","+faststart",compact
  ],{stdio:["ignore","ignore","inherit"]});
  await new Promise((resolve,reject)=>{
    delivery.once("error",reject);
    delivery.once("close",code=>code===0 ? resolve() : reject(new Error("Encodage d’arrivée interrompu : " + code)));
  });
  await fsp.rename(compact,target);
}

async function publishFiles(stage, format) {
  const folder = path.join(destination,format);
  await fsp.mkdir(folder,{recursive:true});
  for (const name of await fsp.readdir(stage)) {
    const file = path.join(folder,name);
    const fresh = file + "." + process.pid + ".new";
    await fsp.copyFile(path.join(stage,name),fresh);
    await fsp.rename(fresh,file);
  }
}

function sourceFingerprint() {
  const entries = [
    "components/traversee/scene","public/traversee/modeles","public/traversee/matieres",
    "public/traversee/estampe.webp","public/matieres"
  ];
  const hash = createHash("sha256");
  function add(entry) {
    const file = path.join(repo,entry);
    const info = fs.statSync(file,{throwIfNoEntry:false});
    if (!info) return;
    if (info.isDirectory()) fs.readdirSync(file).sort().forEach(name=>add(path.join(entry,name)));
    else hash.update(entry + "\0").update(fs.readFileSync(file));
  }
  entries.forEach(add);
  return hash.digest("hex");
}

function writeManifest(source) {
  const manifest = {empreinteSourcesSHA256:source,images:31, poses:Array.from({length:31},(_,i)=>Number((i/30).toFixed(7))), formats:{}};
  for (const [name,geometry] of Object.entries(formats)) {
    const base = path.join(destination,name);
    const bytes = filename => fs.statSync(path.join(base,filename),{throwIfNoEntry:false})?.size;
    const hasPrints=manifest.poses.every((_,index)=>bytes(frameName(index)));
    if (!hasPrints || !stations.every(([label])=>bytes(label+".webp")) || !bytes("lettre.webp") ||
        !bytes("plan-sequence.mp4") || !bytes("ouverture.mp4")) return false;
    const entry = {
      taille:geometry.still, chemin:name + "/frame-{000}.webp",
      invitation:{chemin:name+"/invitation.webp", pose:0.06},
      lettre:{chemin:name+"/lettre.webp", pose:0.895},
      stations:stations.map(([label,pose])=>({chemin:name+"/"+label+".webp",pose})),
      projection:{chemin:name+"/plan-sequence.mp4", taille:geometry.movie, nombreImages:241, imagesParSeconde:24, approcheDernierePose:10, octets:bytes("plan-sequence.mp4")},
      ouverture:{chemin:name+"/ouverture.mp4", nombreImages:63, imagesParSeconde:30, duree:2.1, octets:bytes("ouverture.mp4")}
    };
    manifest.formats[name] = entry;
  }
  const target = path.join(destination,"projection.json");
  const fresh = target + "." + process.pid + ".new";
  fs.writeFileSync(fresh,JSON.stringify(manifest,null,2)+"\n");
  fs.renameSync(fresh,target);
  return true;
}

(async()=>{
  const source=sourceFingerprint();
  if (args.includes("--manifeste")) {
    if (!writeManifest(source)) throw Error("Des tirages ou films sont encore attendus.");
    return;
  }
  const server = await startServer();
  const url = "http://127.0.0.1:" + server.address().port;
  if (args.includes("--plateau")) {console.log(url); return;}
  const work = await fsp.mkdtemp(path.join(os.tmpdir(),"mestier-traversee-"));
  const executable = process.env.MESTIER_CHROMIUM || (fs.existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
  let browser;
  try {
    browser = await chromium.launch({
      executablePath:executable, headless:true,
      args:["--disable-dev-shm-usage","--use-angle=swiftshader","--enable-unsafe-swiftshader"]
    });
    for (const [name,geometry] of Object.entries(formats)) {
      if (chosenFormat && name !== chosenFormat) continue;
      const stage = path.join(work,name);
      await fsp.mkdir(stage);
      if (roughCut) {
        const view = await canvasView(browser,url,geometry.movie,name === "portrait",false);
        try {
          const samples = option("--poses")?.split(",").map(Number) || [0,.03,.06,.14,.23,.33,.41,.50,.59,.69,.77,.86,.95,1];
          for (const pose of samples) {
            if (!Number.isFinite(pose) || pose < 0 || pose > 1) throw Error("Pose invalide.");
            const image = await view.shoot(pose,false);
            const file = pose.toFixed(3) + ".jpg";
            await fsp.writeFile(path.join(stage,file),image);
          }
          await publishFiles(stage,name);
        } finally {await view.close();}
        continue;
      }
      if (wants("planches") || wants("stations")) {
        const view = await canvasView(browser,url,geometry.still,name === "portrait");
        try {
          await printStations(view,stage);
          if (wants("planches")) await printSheets(view,stage,name);
        } finally {await view.close();}
        await publishFiles(stage,name);
        console.log(name,wants("planches") ? "31 tirages et six stations disponibles" : "six stations disponibles");
      }
      if (wants("ouverture") || wants("film")) {
        const view = await canvasView(browser,url,geometry.movie,name === "portrait");
        try {
          for (const mode of ["ouverture","film"]) if (wants(mode)) {
            await record(view,stage,mode,name);
            await publishFiles(stage,name);
            console.log(name,movies[mode].filename,fs.statSync(path.join(stage,movies[mode].filename)).size,"octets");
          }
        } finally {await view.close();}
      }
    }
    if (!roughCut) {
      if (source !== sourceFingerprint()) throw Error("Les matériaux ou le moteur ont changé pendant la projection.");
      writeManifest(source);
    }
  } finally {
    await browser?.close();
    server.close();
    await fsp.rm(work,{recursive:true,force:true});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
