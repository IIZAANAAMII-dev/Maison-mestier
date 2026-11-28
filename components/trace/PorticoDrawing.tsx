export default function PorticoDrawing({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 640 640" fill="none" aria-hidden="true">
    <circle cx="320" cy="320" r="319" fill="#efe0c9"/>
    <circle cx="320" cy="320" r="303" stroke="#79543b" strokeOpacity=".4"/>
    <circle cx="320" cy="320" r="262" stroke="#8e2a23" strokeOpacity=".74" strokeWidth="1.6"/>
    <g className="portico-rules" stroke="#8e2a23" strokeWidth=".85">
      <path strokeOpacity=".39" strokeDasharray="4 6" d="M320 58v524M58 320h524M166 169v290m307-290v290M110 208h420M110 427h420"/>
      <path strokeOpacity=".55" d="M320 51v14m0 510v14M51 320h14m510 0h14M163 175h314m-311-7v14m307-14v14M163 478h314m-311-7v14m307-14v14M124 208v219m-7-219h14m-14 219h14"/>
      <path strokeOpacity=".52" d="M132 450h376l-29-22H158l-26 22Zm49-24v-35h93v35m-92-5h92m124-19 28-8 21 7v25m-49-24v24m27-31v31m-120 1 20-23 28 23"/>
      <path strokeOpacity=".48" d="M257 258h110v87H257zM273 274h78v55h-78zM312 258v-14m0 115v-14"/>
      <circle cx="320" cy="320" r="198" strokeOpacity=".17"/>
      <circle cx="166" cy="427" r="4" fill="#efe0c9"/>
      <circle cx="473" cy="427" r="4" fill="#efe0c9"/>
    </g>
    <g className="portico-volume">
      <path d="M166 426V270c0-35 25-63 67-63h171c43 0 69 27 69 62v157h-31V271c0-20-14-36-38-36H234c-23 0-37 15-37 37v154z" fill="#91342b" fillOpacity=".11"/>
      <path d="M166 426h31m245 0h31M197 427V272c0-22 14-37 37-37h170c24 0 38 16 38 36v156" stroke="#8e2a23" strokeOpacity=".58" strokeWidth="1.6"/>
      <path d="M166 426V270c0-35 25-63 67-63h171c43 0 69 27 69 62v157" stroke="#8e2a23" strokeOpacity=".2" strokeWidth="3"/>
      <path className="portico-stroke" d="M166 426V270c0-35 25-63 67-63h171c43 0 69 27 69 62v157" pathLength="1"
        stroke="#8e2a23" strokeWidth="3.25" strokeLinecap="round"/>
      <path d="M197 351h104v77H197" stroke="#8e2a23" strokeWidth="1.8"/>
      <path d="M207 362h84m-84 11h84m-84 11h84m-84 11h84m-84 11h84" stroke="#8e2a23" strokeOpacity=".44"/>
    </g>
    <g stroke="#8e2a23" strokeWidth="1.25" strokeOpacity=".72">
      <path d="m318 105 2 3 2-3m-4 430 2-3 2 3M104 318l3 2-3 2m432-4-3 2 3 2"/>
      <path d="M281 506h78m-78-4v8m13-6v4m13-4v4m13-6v8m13-6v4m13-4v4m13-6v8"/>
    </g>
  </svg>;
}
