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
  isDraggingTopLogo: false,
  draggedLogoId: null,
  dragStart: { x: 0, y: 0 },
  showQuotes:true, showLine:true, showBadge:false, accentColor:"#CBA552", accentAlpha:1, sepColor:"#CBA552", sepAlpha:1, sepSize:64, sepYOffset:0,
  quoteStyle: "“ ”",
  quoteColor: "#CBA552",
  lineLabel:{text:"", bg:"#063033", color:"#ffffff", radius:18},

  // Overlay movable image
  overlay:{img:null, opacity:1, scale:1, rotation:0, xPerc:50, yPerc:50, visible:true, flipH:false, flipV:false, bright:1, contrast:1, saturate:1},

  // Partners
  showPartners: false,
  partners: [],
  partnersText: "",
  partnersYOffset: 0
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
            <div class="row tight">
                <label>حجم الخط</label>
                <input type="range" min="12" max="48" value="${partner.textSize || 24}" data-partner-id="${partner.id}" class="partner-text-size-input">
            </div>
            <div class="row">
                <label>موضع النص</label>
                <select data-partner-id="${partner.id}" class="partner-text-position-input">
                    <option value="bottom" ${partner.textPosition === 'bottom' ? 'selected' : ''}>أسفل</option>
                    <option value="top" ${partner.textPosition === 'top' ? 'selected' : ''}>أعلى</option>
                    <option value="left" ${partner.textPosition === 'left' ? 'selected' : ''}>يسار</option>
                    <option value="right" ${partner.textPosition === 'right' ? 'selected' : ''}>يمين</option>
                </select>
            </div>
            <div class="row">
                <label>لون الشعار</label>
                <select data-partner-id="${partner.id}" class="partner-logo-color-input">
                    <option value="normal" ${partner.logoColor === 'normal' ? 'selected' : ''}>عادي</option>
                    <option value="gold" ${partner.logoColor === 'gold' ? 'selected' : ''}>ذهبي</option>
                    <option value="white" ${partner.logoColor === 'white' ? 'selected' : ''}>أبيض</option>
                    <option value="black" ${partner.logoColor === 'black' ? 'selected' : ''}>أسود</option>
                </select>
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
    document.querySelectorAll(".partner-text-size-input").forEach(input => input.addEventListener("input", handlePartnerTextSizeChange));
    document.querySelectorAll(".partner-text-position-input").forEach(input => input.addEventListener("change", handlePartnerTextPositionChange));
    document.querySelectorAll(".partner-logo-color-input").forEach(input => input.addEventListener("change", handlePartnerLogoColorChange));
    document.querySelectorAll(".remove-partner").forEach(button => button.addEventListener("click", handleRemovePartner));
}

function handlePartnerTextSizeChange(e) {
    const partner = findPartner(e.target.dataset.partnerId);
    if (partner) { partner.textSize = parseInt(e.target.value); draw(); }
}

function handlePartnerTextPositionChange(e) {
    const partner = findPartner(e.target.dataset.partnerId);
    if (partner) { partner.textPosition = e.target.value; draw(); }
}

function handlePartnerLogoColorChange(e) {
    const partner = findPartner(e.target.dataset.partnerId);
    if (partner) { partner.logoColor = e.target.value; draw(); }
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
            <div class="grid2">
                <div class="row tight"><label>سطوع</label><input type="range" min="0" max="3" step="0.01" value="${logo.brightness}" data-logo-id="${logo.id}" class="top-logo-brightness-input"></div>
                <div class="row tight"><label>تباين</label><input type="range" min="0" max="3" step="0.01" value="${logo.contrast}" data-logo-id="${logo.id}" class="top-logo-contrast-input"></div>
            </div>
            <div class="row">
                <label>لون الشعار</label>
                <select data-logo-id="${logo.id}" class="top-logo-color-input">
                    <option value="normal" ${logo.logoColor === 'normal' ? 'selected' : ''}>عادي</option>
                    <option value="gold" ${logo.logoColor === 'gold' ? 'selected' : ''}>ذهبي</option>
                    <option value="white" ${logo.logoColor === 'white' ? 'selected' : ''}>أبيض</option>
                    <option value="black" ${logo.logoColor === 'black' ? 'selected' : ''}>أسود</option>
                </select>
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
    document.querySelectorAll(".top-logo-brightness-input").forEach(input => input.addEventListener("input", handleTopLogoBrightnessChange));
    document.querySelectorAll(".top-logo-contrast-input").forEach(input => input.addEventListener("input", handleTopLogoContrastChange));
    document.querySelectorAll(".top-logo-color-input").forEach(input => input.addEventListener("change", handleTopLogoColorChange));
    document.querySelectorAll(".remove-top-logo").forEach(button => button.addEventListener("click", handleRemoveTopLogo));
}

function handleTopLogoBrightnessChange(e) {
    const logo = findTopLogo(e.target.dataset.logoId);
    if (logo) { logo.brightness = parseFloat(e.target.value); draw(); }
}

function handleTopLogoContrastChange(e) {
    const logo = findTopLogo(e.target.dataset.logoId);
    if (logo) { logo.contrast = parseFloat(e.target.value); draw(); }
}

function handleTopLogoColorChange(e) {
    const logo = findTopLogo(e.target.dataset.logoId);
    if (logo) { logo.logoColor = e.target.value; draw(); }
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
    if (!state.showPartners || state.partners.length === 0) return;

    const totalPartners = state.partners.length;
    const padding = canvas.width * 0.1;
    const totalWidth = canvas.width - (padding * 2);
    const spacing = totalPartners > 1 ? (totalWidth / (totalPartners - 1)) : 0;
    const yPos = (canvas.height * 0.9) + state.partnersYOffset;

    ctx.save();
    ctx.textAlign = "center";

    if (state.partnersText) {
        ctx.fillStyle = state.textColor;
        ctx.font = `bold ${Math.round(state.fontSize * 0.3)}px Tajawal`;
        ctx.textBaseline = "top";
        ctx.fillText(state.partnersText, canvas.width / 2, yPos - 40);
    }

    state.partners.forEach((partner, index) => {
        const x = padding + (spacing * index);

        // Draw dividing lines
        if (index > 0) {
            const prevX = padding + (spacing * (index - 1));
            const midX = (prevX + x) / 2;
            ctx.beginPath();
            ctx.moveTo(midX, yPos - 20);
            ctx.lineTo(midX, yPos + 20);
            ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        if (!partner.img) return;

        const logoHeight = canvas.height * 0.04 * (partner.scale || 0.5);
        const ir = partner.img.width / partner.img.height;
        const logoWidth = logoHeight * ir;

        let logoX = x - logoWidth / 2;
        let logoY = yPos - logoHeight / 2;
        let textX = x;
        let textY;

        ctx.font = `bold ${partner.textSize || 24}px Tajawal`;
        const textMetrics = ctx.measureText(partner.name);
        const textWidth = textMetrics.width;

        switch (partner.textPosition) {
            case 'top':
                textY = yPos - logoHeight / 2 - 5;
                logoY = yPos + 5;
                ctx.textBaseline = "bottom";
                break;
            case 'left':
                logoX = x + textWidth / 2 + 5;
                textX = x - logoWidth / 2 - 5;
                ctx.textAlign = "right";
                ctx.textBaseline = "middle";
                break;
            case 'right':
                logoX = x - textWidth / 2 - 5;
                textX = x + logoWidth / 2 + 5;
                ctx.textAlign = "left";
                ctx.textBaseline = "middle";
                break;
            case 'bottom':
            default:
                textY = yPos + logoHeight / 2 + 5;
                logoY = yPos - 5;
                ctx.textBaseline = "top";
                break;
        }

        // Draw Logo with colorization
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = logoWidth;
        tempCanvas.height = logoHeight;

        tempCtx.drawImage(partner.img, 0, 0, logoWidth, logoHeight);

        if (partner.logoColor !== 'normal') {
            tempCtx.globalCompositeOperation = 'source-in';
            tempCtx.fillStyle = partner.logoColor === 'gold' ? '#FFD700' : partner.logoColor;
            tempCtx.fillRect(0, 0, logoWidth, logoHeight);
        }

        ctx.save();
        ctx.filter = `brightness(${partner.brightness}) contrast(${partner.contrast})`;
        ctx.drawImage(tempCanvas, logoX, logoY, logoWidth, logoHeight);
        ctx.restore();

        // Draw Text
        ctx.fillStyle = state.textColor;
        ctx.fillText(partner.name, textX, textY);
        // Reset alignment for next partner
        ctx.textAlign = "center";
    });

    ctx.restore();
}

function drawTopLogos() {
    state.topLogos.forEach(logo => {
        if (!logo.img) return;

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

        const x = canvas.width * (logo.x / 100) - w / 2;
        const y = canvas.height * (logo.y / 100) - h / 2;

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = w;
        tempCanvas.height = h;

        tempCtx.drawImage(img, 0, 0, w, h);

        if (logo.logoColor !== 'normal') {
            tempCtx.globalCompositeOperation = 'source-in';
            tempCtx.fillStyle = logo.logoColor === 'gold' ? '#FFD700' : logo.logoColor;
            tempCtx.fillRect(0, 0, w, h);
        }

        ctx.save();
        ctx.globalAlpha = logo.opacity;
        ctx.filter = `brightness(${logo.brightness}) contrast(${logo.contrast})`;
        ctx.drawImage(tempCanvas, x, y, w, h);
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
        x: 50, // Initial X position in percentage
        y: 5,   // Initial Y position in percentage
        brightness: 1,
        contrast: 1,
        logoColor: "normal"
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
  $("#partnersYOffset").addEventListener("input", e=>{ state.partnersYOffset = parseInt(e.target.value); draw(); });
  $("#addPartner").addEventListener("click", () => {
    if (state.partners.length < 8) {
      state.partners.push({
          id: Date.now(),
          img: null,
          name: "شريك جديد",
          brightness: 1,
          contrast: 1,
          scale: 0.5,
          textPosition: "bottom",
          logoColor: "normal",
          textSize: 24
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

        // Check if dragging a top logo
        for (const logo of state.topLogos.slice().reverse()) {
            if (!logo.img) continue;
            const target = canvas.width * logo.scale;
            const ir = logo.img.width / logo.img.height;
            let w, h;
            if (ir >= 1) { w = target; h = target / ir; } else { h = target; w = h * ir; }
            const logoX = canvas.width * (logo.x / 100) - w / 2;
            const logoY = canvas.height * (logo.y / 100) - h / 2;

            if (x > logoX && x < logoX + w && y > logoY && y < logoY + h) {
                state.isDraggingTopLogo = true;
                state.draggedLogoId = logo.id;
                state.dragStart.x = x - (canvas.width * (logo.x / 100));
                state.dragStart.y = y - (canvas.height * (logo.y / 100));
                return;
            }
        }

        const maxW = canvas.width * 0.76;
        const lines = wrapText(state.quote, maxW);
        const totalH = lines.length * state.fontSize * state.lineHeight;
        const textX = canvas.width * (state.textPos.x / 100);
        const textY = canvas.height * (state.textPos.y / 100);
        const startY = textY - totalH / 2;

        // Simple bounding box check
        if (x > textX - maxW/2 && x < textX + maxW/2 && y > startY && y < startY + totalH) {
            state.isDraggingText = true;
            state.dragStart.x = x - textX;
            state.dragStart.y = y - textY;
        }
    });

    canvas.addEventListener("mousemove", e => {
        if (state.isDraggingTopLogo) {
            const logo = findTopLogo(state.draggedLogoId);
            if (!logo) return;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            logo.x = ((x - state.dragStart.x) / canvas.width) * 100;
            logo.y = ((y - state.dragStart.y) / canvas.height) * 100;
            draw();
            return;
        }

        if (!state.isDraggingText) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        state.textPos.x = ((x - state.dragStart.x) / canvas.width) * 100;
        state.textPos.y = ((y - state.dragStart.y) / canvas.height) * 100;
        draw();
    });

    canvas.addEventListener("mouseup", () => {
        state.isDraggingText = false;
        state.isDraggingTopLogo = false;
        state.draggedLogoId = null;
    });

    canvas.addEventListener("mouseout", () => {
        state.isDraggingText = false;
        state.isDraggingTopLogo = false;
        state.draggedLogoId = null;
    });

  // export & reset
  $("#btnPreview").addEventListener("click", () => {
      const previewImage = $("#previewImage");
      previewImage.src = canvas.toDataURL("image/png");
  });

  $("#btnExport").addEventListener("click", ()=>{
    const format = $("#exportFormat").value;
    const a = document.createElement("a");
    a.download = `hamidin-quote.${format}`;
    a.href = canvas.toDataURL(`image/${format}`);
    a.click();
  });
  $("#btnReset").addEventListener("click", ()=>{
    state = {
      size:1080,
      grad:{c1:"#0f6f73", c2:"#0b4e50", angle:25},
      bgImage:null, bgImageOpacity:0.25, bgFit:"cover", bgBlur:0, bgBright:1, bgContrast:1,
      wmLogo:null, wmEnabled:true, wmOpacity:0.08, wmScale:1.4,
      topLogos: [],
      quote:"وقتك رأسُ مالك؛ إن أضعته اليوم أضعتَ غدَك.",
      fontSize:72, lineHeight:1.35, textColor:"#ffffff", textShadow:true, textAlign:"center",
      textPos: { x: 50, y: 50 },
      isDraggingText: false,
      isDraggingTopLogo: false,
      draggedLogoId: null,
      dragStart: { x: 0, y: 0 },
      showQuotes:true, showLine:true, showBadge:false, accentColor:"#CBA552", accentAlpha:1, sepColor:"#CBA552", sepAlpha:1, sepSize:64, sepYOffset:0,
      quoteStyle: "“ ”",
      quoteColor: "#CBA552",
      lineLabel:{text:"", bg:"#063033", color:"#ffffff", radius:18},
      overlay:{img:null, opacity:1, scale:1, rotation:0, xPerc:50, yPerc:50, visible:true, flipH:false, flipV:false, bright:1, contrast:1, saturate:1},
      showPartners: false,
      partners: [],
      partnersText: "",
      partnersYOffset: 0
    };
    // Also reset UI controls
    $('#canvasSize').value='1080'; $('#bg1').value='#0f6f73'; $('#bg2').value='#0b4e50'; $('#gradAngle').value=25;
    $('#bgImage').value=''; $('#bgImageOpacity').value=0.25; $('#bgBlur').value=0; $('#bgFit').value='cover';
    $('#wmLogo').value=''; $('#wmEnabled').checked=true; $('#wmOpacity').value=0.08; $('#wmScale').value=1.4;
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
hookUI(); setSize(1280); draw();
