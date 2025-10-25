const $ = s=>document.querySelector(s);
const canvas = $("#canvas"); const ctx = canvas.getContext("2d");

let state = {
  size:1080,
  grad:{c1:"#0f6f73", c2:"#0b4e50", angle:25},
  bgImage:null, bgImageOpacity:0.25, bgFit:"cover", bgBlur:0, bgBright:1, bgContrast:1,

  // Logos (v5 baseline with fixed top-right position at 10px)
  wmLogo:null, wmEnabled:true, wmOpacity:0.08, wmScale:1.4,
  topLogos: [],

  // Text & decor
  quote:"وقتك رأسُ مالك؛ إن أضعته اليوم أضعتَ غدَك.",
  fontSize:72, lineHeight:1.35, textColor:"#ffffff", textShadow:true, textAlign:"center",
  textPos: { x: 50, y: 50 }, // X, Y in percentage
  isDraggingText: false,
  dragStart: { x: 0, y: 0 },
  showQuotes:true, showLine:true, showBadge:false, accentColor:"#CBA552", accentAlpha:1, sepColor:"#CBA552", sepAlpha:1, sepSize:64, sepYOffset:0,
  quoteStyle: "“ ”",
  quoteColor: "#CBA552",
  lineLabel:{text:"", bg:"#063033", color:"#ffffff", radius:18},

  // Overlay movable image
  overlay:{img:null, opacity:1, scale:1, rotation:0, xPerc:50, yPerc:50, visible:true, flipH:false, flipV:false, bright:1, contrast:1, saturate:1, isDragging: false},

  // Partners
  showPartners: false,
  partners: [],
  partnersText: "شركاؤنا",
  partnersTextPos: { x: 50, y: 95 },
  partnersTextScale: 0.3,
  isDraggingPartnersText: false,
};

function setSize(n){ state.size=n; canvas.width=n; canvas.height=n; draw(); }
function deg2rad(d){ return d*Math.PI/180; }

function drawGradient(){
  const ang = deg2rad(state.grad.angle);
  const r = canvas.width/2;
  const x = Math.cos(ang)*r, y = Math.sin(ang)*r;
  const g = ctx.createLinearGradient(canvas.width/2-x, canvas.height/2-y, canvas.width/2+x, canvas.height/2+y);
  g.addColorStop(0, state.grad.c1); g.addColorStop(1, state.grad.c2);
  ctx.fillStyle = g; ctx.fillRect(0,0,canvas.width,canvas.height);
}
function drawBackgroundImage(){
  if(!state.bgImage) return;
  ctx.save();
  if("filter" in ctx){
    ctx.filter = `blur(${state.bgBlur}px) brightness(${state.bgBright}) contrast(${state.bgContrast})`;
  } else {
    ctx.filter = `blur(${state.bgBlur}px)`;
  }
  ctx.globalAlpha = state.bgImageOpacity;
  const img = state.bgImage, cw=canvas.width, ch=canvas.height;
  const ir = img.width/img.height, cr=cw/ch;
  let w,h,dx,dy;
  if(state.bgFit==="cover"){
    if(ir>cr){ h=ch; w=h*ir; dx=(cw-w)/2; dy=0; } else { w=cw; h=w/ir; dx=0; dy=(ch-h)/2; }
  }else{
    if(ir>cr){ w=cw; h=w/ir; dx=0; dy=(ch-h)/2; } else { h=ch; w=h*ir; dx=(cw-w)/2; dy=0; }
  }
  ctx.drawImage(img, dx, dy, w, h);
  ctx.filter="none"; ctx.restore();
}
function drawLogoWatermark(){
  if(!state.wmEnabled || !state.wmLogo) return;
  const img = state.wmLogo;
  const target = Math.min(canvas.width, canvas.height)*state.wmScale;
  const ir = img.width/img.height;
  let w,h; if(ir>=1){ w=target; h=target/ir; } else { h=target; w=h*ir; }
  const x = canvas.width/2 - w/2, y = canvas.height/2 - h/2;
  ctx.save(); ctx.globalAlpha = state.wmOpacity; ctx.drawImage(img, x, y, w, h); ctx.restore();
}
function drawOverlay(){
  const o = state.overlay; if(!o.visible || !o.img) return;
  const img=o.img; const cx = canvas.width*(o.xPerc/100), cy = canvas.height*(o.yPerc/100);
  const base = Math.min(canvas.width, canvas.height)*0.5*o.scale; const ir=img.width/img.height;
  let w,h; if(ir>=1){ w=base; h=base/ir; } else { h=base; w=h*ir; }
  ctx.save(); ctx.globalAlpha=o.opacity; ctx.translate(cx,cy); ctx.rotate(deg2rad(o.rotation));
  ctx.scale(o.flipH?-1:1, o.flipV?-1:1);
  if("filter" in ctx){ ctx.filter = `brightness(${o.bright}) contrast(${o.contrast}) saturate(${o.saturate})`; }
  ctx.drawImage(img, -w/2, -h/2, w, h); ctx.filter="none"; ctx.restore();
}
function wrapText(text, maxW){
  const words = text.split(/\s+/); const lines=[]; let line="";
  ctx.font = `900 ${state.fontSize}px Tajawal, system-ui`;
  for(const word of words){
    const test = (line?line+" ":"")+word;
    if(ctx.measureText(test).width <= maxW){ line=test; }
    else{ if(line) lines.push(line); line=word; }
  }
  if(line) lines.push(line); return lines;
}
function drawDecor(){
  const pad = canvas.width*0.09, color = hexWithAlpha(state.accentColor, state.accentAlpha);
  ctx.save(); ctx.fillStyle=color; ctx.strokeStyle=color;
  if (state.showLine) {
    const t = state.lineLabel.text;
    const lineY = canvas.height * 0.85;
    ctx.lineWidth = 6;
    ctx.beginPath();

    if (t) {
        // If there's text, draw line with a gap for the label
        ctx.font = `800 ${Math.round(state.fontSize * 0.45)}px Tajawal`;
        const paddingX = 18;
        const textW = ctx.measureText(t).width;
        const boxW = textW + paddingX * 2;
        const gap = boxW + 20; // A little extra padding

        const startX = pad;
        const endX = canvas.width - pad;
        const midX = canvas.width / 2;

        ctx.moveTo(startX, lineY);
        ctx.lineTo(midX - gap / 2, lineY);
        ctx.moveTo(midX + gap / 2, lineY);
        ctx.lineTo(endX, lineY);
    } else {
        // If no text, draw a single continuous line
        ctx.moveTo(pad, lineY);
        ctx.lineTo(canvas.width - pad, lineY);
    }
    ctx.stroke();
  }

  // الفواصل أعلى النص
  if(state.showQuotes && state.quoteStyle !== 'none'){
    const [startQuote, endQuote] = state.quoteStyle.split(' ');
    const size = state.sepSize;
    ctx.fillStyle = hexWithAlpha(state.quoteColor, state.sepAlpha);
    ctx.textAlign="center";
    ctx.font=`900 ${size}px Tajawal`;

    // Draw quote above the text
    ctx.textBaseline="bottom";
    const topY = canvas.height * (state.textPos.y / 100) - (wrapText(state.quote, canvas.width * 0.76).length * state.fontSize * state.lineHeight) / 2;
    ctx.fillText(startQuote, canvas.width/2, topY - 10);

    // Draw quote below the text
    ctx.textBaseline="top";
    const bottomY = canvas.height * (state.textPos.y / 100) + (wrapText(state.quote, canvas.width * 0.76).length * state.fontSize * state.lineHeight) / 2;
    ctx.fillText(endQuote, canvas.width/2, bottomY + 10);
  }

  if(state.showBadge){ ctx.globalAlpha*=0.92; ctx.beginPath(); ctx.arc(canvas.width*0.12, canvas.height*0.18, canvas.width*0.035, 0, Math.PI*2); ctx.fill(); }
  ctx.restore();
}

function drawText(){
  const maxW = canvas.width*0.76; ctx.save(); ctx.fillStyle=state.textColor; ctx.textBaseline="top";
  if(state.textShadow){ ctx.shadowColor="rgba(0,0,0,.35)"; ctx.shadowBlur=10; ctx.shadowOffsetY=3; }

  const x = canvas.width * (state.textPos.x / 100);
  const y = canvas.height * (state.textPos.y / 100);

  ctx.textAlign = state.textAlign;
  ctx.font=`900 ${state.fontSize}px Tajawal, system-ui`;
  const lines = wrapText(state.quote, maxW); const totalH = lines.length*state.fontSize*state.lineHeight;
  const startY = y - totalH / 2;
  const lineSpacing = state.fontSize*(state.lineHeight-1);
  lines.forEach((ln,i)=> ctx.fillText(ln, x, startY + i*(state.fontSize+lineSpacing)));
  ctx.restore();
}
function drawLineLabel(){
  if(!state.showLine) return;
  const t = state.lineLabel.text; if(!t) return;
  const y = canvas.height*0.85; ctx.save();
  ctx.font = `800 ${Math.round(state.fontSize*0.45)}px Tajawal`;
  const paddingX=18, paddingY=8; const textW = ctx.measureText(t).width;
  const boxW = textW + paddingX*2, boxH = state.fontSize*0.45 + paddingY*2;
  const x = (canvas.width - boxW)/2, r = state.lineLabel.radius;
  ctx.fillStyle = hexWithAlpha(state.lineLabel.bg, 0.96); roundRect(ctx, x, y-boxH/2, boxW, boxH, r); ctx.fill();
  ctx.fillStyle = state.lineLabel.color; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(t, canvas.width/2, y);
  ctx.restore();
}
function roundRect(ctx,x,y,w,h,r){ r=Math.min(r,w/2,h/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function hexWithAlpha(hex, a=1){ let h=hex.replace("#",""); if(h.length===3) h=h.split("").map(c=>c+c).join(""); const r=parseInt(h.slice(0,2),16), g=parseInt(h.slice(2,4),16), b=parseInt(h.slice(4,6),16); return `rgba(${r},${g},${b},${a})`; }

// Partner rendering logic
// Renders individual UI controls for each partner, including scale, brightness, etc.
function renderPartnersUI() {
    const container = $("#partnersContainer");
    container.innerHTML = ""; // Clear existing controls
    state.partners.forEach((partner, index) => {
        const partnerEl = document.createElement("div");
        partnerEl.className = "partner-controls";
        partnerEl.style.marginTop = "10px";
        partnerEl.innerHTML = `
            <div class="row">
                <label>شعار ${index + 1}</label>
                <input type="file" accept="image/*" data-partner-id="${partner.id}" class="partner-logo-input">
            </div>
            <div class="row">
                <label>اسم ${index + 1}</label>
                <input type="text" value="${partner.name}" data-partner-id="${partner.id}" class="partner-name-input" style="flex-grow: 1;">
            </div>
            <div class="grid2">
                <div class="row tight"><label>سطوع</label><input type="range" min="0" max="2" step="0.01" value="${partner.brightness}" data-partner-id="${partner.id}" class="partner-brightness-input"></div>
                <div class="row tight"><label>تباين</label><input type="range" min="0" max="2" step="0.01" value="${partner.contrast}" data-partner-id="${partner.id}" class="partner-contrast-input"></div>
            </div>
             <div class="row tight"><label>حجم</label><input type="range" min="0.1" max="1.5" step="0.05" value="${partner.scale || 0.5}" data-partner-id="${partner.id}" class="partner-scale-input"></div>
            <div class="row" style="margin-top: 5px;">
                <button class="ghost remove-partner" data-partner-id="${partner.id}" style="width: 100%;">إزالة الشريك ${index + 1}</button>
            </div>
            <hr style="border-color:#0b4e50;opacity:.4;margin-top:15px;">
        `;
        container.appendChild(partnerEl);
    });

    // Add event listeners for the newly created controls
    document.querySelectorAll(".partner-logo-input").forEach(input => input.addEventListener("change", handlePartnerLogoChange));
    document.querySelectorAll(".partner-name-input").forEach(input => input.addEventListener("input", handlePartnerNameChange));
    document.querySelectorAll(".partner-brightness-input").forEach(input => input.addEventListener("input", handlePartnerBrightnessChange));
    document.querySelectorAll(".partner-contrast-input").forEach(input => input.addEventListener("input", handlePartnerContrastChange));
    document.querySelectorAll(".partner-scale-input").forEach(input => input.addEventListener("input", handlePartnerScaleChange));
    document.querySelectorAll(".remove-partner").forEach(button => button.addEventListener("click", handleRemovePartner));
}

function findPartner(id) {
    return state.partners.find(p => p.id === Number(id));
}

function handlePartnerLogoChange(e) {
    const id = e.target.dataset.partnerId;
    const partner = findPartner(id);
    if (!partner) return;
    const f = e.target.files[0];
    if (!f) return;
    const img = new Image();
    img.onload = () => { partner.img = img; draw(); };
    img.src = URL.createObjectURL(f);
}

function handlePartnerNameChange(e) {
    const partner = findPartner(e.target.dataset.partnerId);
    if (partner) { partner.name = e.target.value; draw(); }
}

function handlePartnerBrightnessChange(e) {
    const partner = findPartner(e.target.dataset.partnerId);
    if (partner) { partner.brightness = parseFloat(e.target.value); draw(); }
}

function handlePartnerContrastChange(e) {
    const partner = findPartner(e.target.dataset.partnerId);
    if (partner) { partner.contrast = parseFloat(e.target.value); draw(); }
}

function handlePartnerScaleChange(e) {
    const partner = findPartner(e.target.dataset.partnerId);
    if (partner) { partner.scale = parseFloat(e.target.value); draw(); }
}

function handleRemovePartner(e) {
    const id = e.target.dataset.partnerId;
    state.partners = state.partners.filter(p => p.id !== Number(id));
    renderPartnersUI();
    draw();
}

// Renders individual UI controls for each top logo, including scale and opacity.
function renderTopLogosUI() {
    const container = $("#topLogosContainer");
    container.innerHTML = ""; // Clear existing controls
    state.topLogos.forEach((logo, index) => {
        const logoEl = document.createElement("div");
        logoEl.className = "top-logo-controls";
        logoEl.style.marginTop = "10px";
        logoEl.innerHTML = `
            <div class="row">
                <label>شعار ${index + 1}</label>
                <input type="file" accept="image/*" data-logo-id="${logo.id}" class="top-logo-input">
            </div>
            <div class="grid2">
                <div class="row tight"><label>حجم</label><input type="range" min="0.05" max="0.8" step="0.01" value="${logo.scale}" data-logo-id="${logo.id}" class="top-logo-scale-input"></div>
                <div class="row tight"><label>شفافية</label><input type="range" min="0" max="1" step="0.01" value="${logo.opacity}" data-logo-id="${logo.id}" class="top-logo-opacity-input"></div>
            </div>
            <div class="row" style="margin-top: 5px;">
                <button class="ghost remove-top-logo" data-logo-id="${logo.id}" style="width: 100%;">إزالة الشعار ${index + 1}</button>
            </div>
            <hr style="border-color:#0b4e50;opacity:.4;margin-top:15px;">
        `;
        container.appendChild(logoEl);
    });

    // Add event listeners for the newly created controls
    document.querySelectorAll(".top-logo-input").forEach(input => input.addEventListener("change", handleTopLogoChange));
    document.querySelectorAll(".top-logo-scale-input").forEach(input => input.addEventListener("input", handleTopLogoScaleChange));
    document.querySelectorAll(".top-logo-opacity-input").forEach(input => input.addEventListener("input", handleTopLogoOpacityChange));
    document.querySelectorAll(".remove-top-logo").forEach(button => button.addEventListener("click", handleRemoveTopLogo));
}

function findTopLogo(id) {
    return state.topLogos.find(l => l.id === Number(id));
}

function handleTopLogoChange(e) {
    const id = e.target.dataset.logoId;
    const logo = findTopLogo(id);
    if (!logo) return;
    const f = e.target.files[0];
    if (!f) return;
    const img = new Image();
    img.onload = () => { logo.img = img; draw(); };
    img.src = URL.createObjectURL(f);
}

function handleTopLogoScaleChange(e) {
    const logo = findTopLogo(e.target.dataset.logoId);
    if (logo) { logo.scale = parseFloat(e.target.value); draw(); }
}

function handleTopLogoOpacityChange(e) {
    const logo = findTopLogo(e.target.dataset.logoId);
    if (logo) { logo.opacity = parseFloat(e.target.value); draw(); }
}

function handleRemoveTopLogo(e) {
    const id = e.target.dataset.logoId;
    state.topLogos = state.topLogos.filter(l => l.id !== Number(id));
    renderTopLogosUI();
    draw();
}

function drawPartners() {
    if (!state.showPartners) return;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    state.partners.forEach(partner => {
        if (!partner.img) return;

        const img = partner.img;
        const targetHeight = canvas.height * 0.05 * partner.scale;
        const ir = img.width / img.height;
        const h = targetHeight;
        const w = targetHeight * ir;

        const x = canvas.width * (partner.x / 100);
        const y = canvas.height * (partner.y / 100);

        ctx.save();
        ctx.filter = `brightness(${partner.brightness}) contrast(${partner.contrast})`;
        ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
        ctx.restore();

        ctx.fillStyle = state.textColor;
        ctx.font = `bold ${Math.round(state.fontSize * 0.25)}px Tajawal`;
        ctx.fillText(partner.name, x, y + h / 2 + 15);
    });

    if (state.partnersText) {
        const textX = canvas.width * (state.partnersTextPos.x / 100);
        const textY = canvas.height * (state.partnersTextPos.y / 100);
        ctx.fillStyle = state.textColor;
        ctx.font = `bold ${Math.round(state.fontSize * state.partnersTextScale)}px Tajawal`;
        ctx.fillText(state.partnersText, textX, textY);
    }

    ctx.restore();
}

function drawTopLogos() {
    const sortedLogos = [...state.topLogos].sort((a, b) => a.x - b.x);
    sortedLogos.forEach((logo, index) => {
        if (!logo.img) return;

        if (index > 0) {
            const prevLogo = sortedLogos[index - 1];
            const prevLogoWidth = (canvas.width * prevLogo.scale) * (prevLogo.img.width / prevLogo.img.height);
            const separatorX = (canvas.width * (prevLogo.x / 100)) + (prevLogoWidth / 2) + 5;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(separatorX, (canvas.height * (logo.y / 100)) - 15);
            ctx.lineTo(separatorX, (canvas.height * (logo.y / 100)) + 15);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }

        const img = logo.img;
        const target = canvas.width * logo.scale;
        const ir = img.width / img.height;
        let w, h;
        if (ir >= 1) {
            w = target;
            h = target / ir;
        } else {
            h = target;
            w = h * ir;
        }

        ctx.save();
        ctx.globalAlpha = logo.opacity;
        ctx.drawImage(img, canvas.width * (logo.x / 100) - w / 2, canvas.height * (logo.y / 100) - h / 2, w, h);
        ctx.restore();
    });
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawGradient();

  ctx.save();
  roundRect(ctx, 0, 0, canvas.width, canvas.height, 16);
  ctx.clip();
  drawBackgroundImage();
  drawLogoWatermark();
  drawOverlay();
  ctx.restore();

  drawDecor();
  drawText();
  drawLineLabel();
  drawTopLogos();
  drawPartners();
}

function hookUI(){
  renderTopLogosUI();
  renderPartnersUI();
  $("#canvasSize").addEventListener("change", e=> setSize(parseInt(e.target.value)));
  $("#bg1").addEventListener("input", e=>{state.grad.c1=e.target.value; draw();});
  $("#bg2").addEventListener("input", e=>{state.grad.c2=e.target.value; draw();});
  $("#gradAngle").addEventListener("input", e=>{state.grad.angle=parseInt(e.target.value); draw();});
  $("#bgImage").addEventListener("change", e=>{ const f=e.target.files[0]; if(!f) return; const img=new Image(); img.onload=()=>{state.bgImage=img; draw();}; img.src=URL.createObjectURL(f); });
  $("#bgImageOpacity").addEventListener("input", e=>{state.bgImageOpacity=parseFloat(e.target.value); draw();});
  $("#bgBlur").addEventListener("input", e=>{state.bgBlur=parseFloat(e.target.value); draw();});
  $("#bgFit").addEventListener("change", e=>{state.bgFit=e.target.value; draw();});
  $("#bgBright").addEventListener("input", e=>{state.bgBright=parseFloat(e.target.value); draw();});
  $("#bgContrast").addEventListener("input", e=>{state.bgContrast=parseFloat(e.target.value); draw();});

  // watermark logo
  $("#wmLogo").addEventListener("change", e=>{ const f=e.target.files[0]; if(!f) return; const img=new Image(); img.onload=()=>{state.wmLogo=img; draw();}; img.src=URL.createObjectURL(f); });
  $("#wmEnabled").addEventListener("change", e=>{state.wmEnabled=e.target.checked; draw();});
  $("#wmOpacity").addEventListener("input", e=>{state.wmOpacity=parseFloat(e.target.value); draw();});
  $("#wmScale").addEventListener("input", e=>{state.wmScale=parseFloat(e.target.value); draw();});

  // top-logos
  $("#addTopLogo").addEventListener("click", () => {
    state.topLogos.push({
        id: Date.now(),
        img: null,
        scale: 0.23,
        opacity: 1,
        x: 10 + (state.topLogos.length * 20),
        y: 5,
        isDragging: false,
    });
    renderTopLogosUI();
    draw();
  });

  // text
  $("#quote").addEventListener("input", e=>{state.quote=e.target.value; draw();});
  $("#fontSize").addEventListener("input", e=>{state.fontSize=parseInt(e.target.value); draw();});
  $("#lineHeight").addEventListener("input", e=>{state.lineHeight=parseFloat(e.target.value); draw();});
  $("#textColor").addEventListener("input", e=>{state.textColor=e.target.value; draw();});
  $("#textShadow").addEventListener("change", e=>{state.textShadow=e.target.checked; draw();});
  $("#textAlign").addEventListener("change", e=>{state.textAlign=e.target.value; draw();});
  $("#quoteStyle").addEventListener("change", e=>{state.quoteStyle=e.target.value; draw();});
  $("#quoteColor").addEventListener("input", e=>{state.quoteColor=e.target.value; draw();});
  $("#showQuotes").addEventListener("change", e=>{state.showQuotes=e.target.checked; draw();});
  $("#showLine").addEventListener("change", e=>{state.showLine=e.target.checked; draw();});
  $("#showBadge").addEventListener("change", e=>{state.showBadge=e.target.checked; draw();});
  $("#accentColor").addEventListener("input", e=>{state.accentColor=e.target.value; draw();});
  $("#accentAlpha").addEventListener("input", e=>{state.accentAlpha=parseFloat(e.target.value); draw();});
  $("#sepColor").addEventListener("input", e=>{state.sepColor=e.target.value; draw();});
  $("#sepAlpha").addEventListener("input", e=>{state.sepAlpha=parseFloat(e.target.value); draw();});
  $("#sepSize").addEventListener("input", e=>{state.sepSize=parseInt(e.target.value); draw();});
  $("#sepYOffset").addEventListener("input", e=>{state.sepYOffset=parseInt(e.target.value); draw();});
  $("#lineLabel").addEventListener("input", e=>{state.lineLabel.text=e.target.value; draw();});
  $("#lineLabelBg").addEventListener("input", e=>{state.lineLabel.bg=e.target.value; draw();});
  $("#lineLabelColor").addEventListener("input", e=>{state.lineLabel.color=e.target.value; draw();});
  $("#lineLabelRadius").addEventListener("input", e=>{state.lineLabel.radius=parseInt(e.target.value); draw();});

  // overlay
  $("#overlayImage").addEventListener("change", e=>{ const f=e.target.files[0]; if(!f) return; const img=new Image(); img.onload=()=>{state.overlay.img=img; draw();}; img.src=URL.createObjectURL(f); });
  $("#overlayOpacity").addEventListener("input", e=>{state.overlay.opacity=parseFloat(e.target.value); draw();});
  // Partners
  $("#showPartners").addEventListener("change", e=>{ state.showPartners = e.target.checked; draw(); });
  $("#partnersText").addEventListener("input", e=>{ state.partnersText = e.target.value; draw(); });
  $("#partnersTextScale").addEventListener("input", e=>{ state.partnersTextScale = parseFloat(e.target.value); draw(); });
  $("#addPartner").addEventListener("click", () => {
    if (state.partners.length < 8) {
      state.partners.push({
          id: Date.now(),
          img: null,
          name: "شريك جديد",
          brightness: 1,
          contrast: 1,
          scale: 0.5,
          x: 50,
          y: 90,
          isDragging: false,
      });
      renderPartnersUI();
      draw();
    }
  });
  $("#overlayScale").addEventListener("input", e=>{state.overlay.scale=parseFloat(e.target.value); draw();});
  $("#overlayRotation").addEventListener("input", e=>{state.overlay.rotation=parseFloat(e.target.value); draw();});
  $("#overlayVisible").addEventListener("change", e=>{state.overlay.visible=e.target.checked; draw();});
  $("#overlayX").addEventListener("input", e=>{state.overlay.xPerc=parseFloat(e.target.value); draw();});
  $("#overlayY").addEventListener("input", e=>{state.overlay.yPerc=parseFloat(e.target.value); draw();});
  $("#overlayFlipH").addEventListener("change", e=>{state.overlay.flipH=e.target.checked; draw();});
  $("#overlayFlipV").addEventListener("change", e=>{state.overlay.flipV=e.target.checked; draw();});
  $("#overlayBright").addEventListener("input", e=>{state.overlay.bright=parseFloat(e.target.value); draw();});
  $("#overlayContrast").addEventListener("input", e=>{state.overlay.contrast=parseFloat(e.target.value); draw();});
  $("#overlaySaturate").addEventListener("input", e=>{state.overlay.saturate=parseFloat(e.target.value); draw();});

  // text dragging listeners
    canvas.addEventListener("mousedown", e => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const maxW = canvas.width * 0.76;
        const lines = wrapText(state.quote, maxW);
        const totalH = lines.length * state.fontSize * state.lineHeight;
        const textX = canvas.width * (state.textPos.x / 100);
        const textY = canvas.height * (state.textPos.y / 100);
        const startY = textY - totalH / 2;

        if (x > textX - maxW / 2 && x < textX + maxW / 2 && y > startY && y < startY + totalH) {
            state.isDraggingText = true;
            state.dragStart.x = x - textX;
            state.dragStart.y = y - textY;
            return;
        }

        const partnersTextX = canvas.width * (state.partnersTextPos.x / 100);
        const partnersTextY = canvas.height * (state.partnersTextPos.y / 100);
        const partnersTextWidth = ctx.measureText(state.partnersText).width;
        if (x > partnersTextX - partnersTextWidth / 2 && x < partnersTextX + partnersTextWidth / 2 && y > partnersTextY - 20 && y < partnersTextY + 20) {
            state.isDraggingPartnersText = true;
            state.dragStart.x = x - partnersTextX;
            state.dragStart.y = y - partnersTextY;
            return;
        }

        state.topLogos.forEach(logo => {
            if (logo.img) {
                const logoX = canvas.width * (logo.x / 100);
                const logoY = canvas.height * (logo.y / 100);
                const logoWidth = (canvas.width * logo.scale) * (logo.img.width / logo.img.height);
                const logoHeight = canvas.width * logo.scale;
                if (x > logoX - logoWidth / 2 && x < logoX + logoWidth / 2 && y > logoY - logoHeight / 2 && y < logoY + logoHeight / 2) {
                    logo.isDragging = true;
                    state.dragStart.x = x - logoX;
                    state.dragStart.y = y - logoY;
                }
            }
        });

        state.partners.forEach(partner => {
            if (partner.img) {
                const partnerX = canvas.width * (partner.x / 100);
                const partnerY = canvas.height * (partner.y / 100);
                const partnerHeight = canvas.height * 0.05 * partner.scale;
                const partnerWidth = partnerHeight * (partner.img.width / partner.img.height);

                if (x > partnerX - partnerWidth / 2 && x < partnerX + partnerWidth / 2 && y > partnerY - partnerHeight / 2 && y < partnerY + partnerHeight / 2) {
                    partner.isDragging = true;
                    state.dragStart.x = x - partnerX;
                    state.dragStart.y = y - partnerY;
                }
            }
        });

        if (state.overlay.img && state.overlay.visible) {
            const overlayX = canvas.width * (state.overlay.xPerc / 100);
            const overlayY = canvas.height * (state.overlay.yPerc / 100);
            const overlayWidth = (canvas.width * 0.5 * state.overlay.scale) * (state.overlay.img.width / state.overlay.img.height);
            const overlayHeight = canvas.width * 0.5 * state.overlay.scale;
            if (x > overlayX - overlayWidth / 2 && x < overlayX + overlayWidth / 2 && y > overlayY - overlayHeight / 2 && y < overlayY + overlayHeight / 2) {
                state.overlay.isDragging = true;
                state.dragStart.x = x - overlayX;
                state.dragStart.y = y - overlayY;
            }
        }
    });

    canvas.addEventListener("mousemove", e => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        if (state.isDraggingText) {
            state.textPos.x = ((x - state.dragStart.x) / canvas.width) * 100;
            state.textPos.y = ((y - state.dragStart.y) / canvas.height) * 100;
            draw();
            return;
        }

        if (state.isDraggingPartnersText) {
            state.partnersTextPos.x = ((x - state.dragStart.x) / canvas.width) * 100;
            state.partnersTextPos.y = ((y - state.dragStart.y) / canvas.height) * 100;
            draw();
            return;
        }

        const draggingLogo = state.topLogos.find(logo => logo.isDragging);
        if (draggingLogo) {
            draggingLogo.x = ((x - state.dragStart.x) / canvas.width) * 100;
            draggingLogo.y = ((y - state.dragStart.y) / canvas.height) * 100;
            draw();
        }

        const draggingPartner = state.partners.find(p => p.isDragging);
        if (draggingPartner) {
            draggingPartner.x = ((x - state.dragStart.x) / canvas.width) * 100;
            draggingPartner.y = ((y - state.dragStart.y) / canvas.height) * 100;
            draw();
        }

        if (state.overlay.isDragging) {
            state.overlay.xPerc = ((x - state.dragStart.x) / canvas.width) * 100;
            state.overlay.yPerc = ((y - state.dragStart.y) / canvas.height) * 100;
            draw();
        }
    });

    canvas.addEventListener("mouseup", () => {
        state.isDraggingText = false;
        state.isDraggingPartnersText = false;
        state.topLogos.forEach(logo => logo.isDragging = false);
        state.partners.forEach(p => p.isDragging = false);
        state.overlay.isDragging = false;
    });

    canvas.addEventListener("mouseout", () => {
        state.isDraggingText = false;
        state.isDraggingPartnersText = false;
        state.topLogos.forEach(logo => logo.isDragging = false);
        state.partners.forEach(p => p.isDragging = false);
        state.overlay.isDragging = false;
    });

  // export & reset
  $("#btnPreview").addEventListener("click", () => {
      draw(); // Ensure canvas is up-to-date before showing
      const previewImage = $("#previewImage");
      previewImage.src = canvas.toDataURL("image/png");
  });

  $("#btnExport").addEventListener("click", ()=>{
    draw(); // Ensure canvas is up-to-date before exporting
    const a = document.createElement("a");
    a.download = "hamidin-quote.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  });
  $("#btnReset").addEventListener("click", ()=>{
    state = {
      size:1080,
      grad:{c1:"#0f6f73", c2:"#0b4e50", angle:25},
      bgImage:null, bgImageOpacity:0.25, bgFit:"cover", bgBlur:0, bgBright:1, bgContrast:1,
      wmLogo:null, wmEnabled:true, wmOpacity:0.08, wmScale:1.4,
      topLogo:null, topEnabled:true, topScale:0.23, topRotation:0, topOpacity:1, topFlipH:false, topFlipV:false,
      quote:"وقتك رأسُ مالك؛ إن أضعته اليوم أضعتَ غدَك.",
      fontSize:72, lineHeight:1.35, textColor:"#ffffff", textShadow:true, textAlign:"center",
      textPos: { x: 50, y: 50 },
      isDraggingText: false,
      dragStart: { x: 0, y: 0 },
      showQuotes:true, showLine:true, showBadge:false, accentColor:"#CBA552", accentAlpha:1, sepColor:"#CBA552", sepAlpha:1, sepSize:64, sepYOffset:0,
      quoteStyle: "“ ”",
      quoteColor: "#CBA552",
      lineLabel:{text:"", bg:"#063033", color:"#ffffff", radius:18},
      overlay:{img:null, opacity:1, scale:1, rotation:0, xPerc:50, yPerc:50, visible:true, flipH:false, flipV:false, bright:1, contrast:1, saturate:1},
      showPartners: false,
      partners: []
    };
    // Also reset UI controls
    $('#canvasSize').value='1080'; $('#bg1').value='#0f6f73'; $('#bg2').value='#0b4e50'; $('#gradAngle').value=25;
    $('#bgImage').value=''; $('#bgImageOpacity').value=0.25; $('#bgBlur').value=0; $('#bgFit').value='cover';
    $('#wmLogo').value=''; $('#wmEnabled').checked=true; $('#wmOpacity').value=0.08; $('#wmScale').value=1.4;
    $('#topLogo').value=''; $('#topEnabled').checked=true; $('#topScale').value=0.23; $('#topRotation').value=0; $('#topOpacity').value=1; $('#topFlipH').checked=false; $('#topFlipV').checked=false;
    $('#quote').value=state.quote; $('#fontSize').value=72; $('#lineHeight').value=1.35; $('#textColor').value='#ffffff'; $('#textShadow').checked=true; $('#textAlign').value='center';
    $('#quoteStyle').value='“ ”'; $('#quoteColor').value='#CBA552';
    $('#showQuotes').checked=true; $('#showLine').checked=true; $('#showBadge').checked=false; $('#accentColor').value='#CBA552'; $('#accentAlpha').value=1;
    $('#lineLabel').value=''; $('#lineLabelBg').value='#063033'; $('#lineLabelColor').value='#ffffff'; $('#lineLabelRadius').value=18;
    $('#overlayImage').value=''; $('#overlayOpacity').value=1; $('#overlayScale').value=1; $('#overlayRotation').value=0; $('#overlayVisible').checked=true; $('#overlayX').value=50; $('#overlayY').value=50; $('#overlayFlipH').checked=false; $('#overlayFlipV').checked=false; $('#overlayBright').value=1; $('#overlayContrast').value=1; $('#overlaySaturate').value=1;
    $('#showPartners').checked = false;
    renderPartnersUI();
    state.topLogos = [];
    renderTopLogosUI();
    setSize(1280);
  });
}
hookUI();
setSize(1280); // This will also trigger the initial draw
