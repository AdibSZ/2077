export interface CyberAvatarConfig {
  palette: 'cyan' | 'yellow' | 'pink' | 'green' | 'violet';
  headgear: 'mohawk' | 'undercut' | 'cowl' | 'headset' | 'slick';
  visor: 'cyber_visor' | 'mono_scanner' | 'shades' | 'bionic' | 'none';
  mask: 'breather' | 'collar' | 'matrix_mask' | 'none';
  implant: 'neural_jack' | 'cheek_leds' | 'barcode' | 'none';
  backgroundPattern: 'hex' | 'radar' | 'scanlines';
}

export const PALETTES = {
  cyan: { primary: '#00F0FF', secondary: '#0A2540', accent: '#5DF8D8', nameFa: 'نایت‌سیتی فیروزه‌ای' },
  yellow: { primary: '#FCEE0A', secondary: '#262200', accent: '#FFE600', nameFa: 'زرد سایبرپانکی' },
  pink: { primary: '#FF0055', secondary: '#2D0014', accent: '#F62477', nameFa: 'نئون صورتی گلیچ' },
  green: { primary: '#00FF66', secondary: '#002611', accent: '#5DF89B', nameFa: 'ماتریکس سبز بایو' },
  violet: { primary: '#B026FF', secondary: '#1C002B', accent: '#D97706', nameFa: 'بنفش اورکلاک' },
};

export const HEADGEARS = [
  { id: 'mohawk', nameFa: 'موهای موهاک نئونی' },
  { id: 'undercut', nameFa: 'مدل گلیچ سایبر نامتقارن' },
  { id: 'cowl', nameFa: 'هودی هکری نت‌رانر' },
  { id: 'headset', nameFa: 'هدست تاکتیکال ارتباطی' },
  { id: 'slick', nameFa: 'مدل اسلیک سینت‌ویو' },
] as const;

export const VISORS = [
  { id: 'cyber_visor', nameFa: 'عینک واقعیت افزوده HUD' },
  { id: 'mono_scanner', nameFa: 'اسکنر تک‌چشم تاکتیکال' },
  { id: 'shades', nameFa: 'شیدهای تیره رترو سایبر' },
  { id: 'bionic', nameFa: 'چشمان بیونیک نورانی' },
  { id: 'none', nameFa: 'بدون عینک (دید ارگانیک)' },
] as const;

export const MASKS = [
  { id: 'breather', nameFa: 'ماسک تصفیه نانو با فیلتر نوری' },
  { id: 'collar', nameFa: 'طوقه محافظ گردنی فیبر کربن' },
  { id: 'matrix_mask', nameFa: 'ماسک مشبک صوتی هکری' },
  { id: 'none', nameFa: 'بدون ماسک' },
] as const;

export const IMPLANTS = [
  { id: 'neural_jack', nameFa: 'پورت نئونی شقیقه (Neural Jack)' },
  { id: 'cheek_leds', nameFa: 'مدارهای نوری گونه (Cyber LEDs)' },
  { id: 'barcode', nameFa: 'بارکد شناسایی و سریال' },
  { id: 'none', nameFa: 'بدون ایمپلنت سطحی' },
] as const;

export function generateRandomConfig(): CyberAvatarConfig {
  const pKeys = Object.keys(PALETTES) as (keyof typeof PALETTES)[];
  const rand = <T>(arr: readonly T[] | T[]): T => arr[Math.floor(Math.random() * arr.length)];
  return {
    palette: rand(pKeys),
    headgear: rand(HEADGEARS).id as any,
    visor: rand(VISORS).id as any,
    mask: rand(MASKS).id as any,
    implant: rand(IMPLANTS).id as any,
    backgroundPattern: rand(['hex', 'radar', 'scanlines']),
  };
}

export function generateCyberAvatarSvg(cfg: CyberAvatarConfig): string {
  const pal = PALETTES[cfg.palette] || PALETTES.cyan;

  // Background Pattern
  let bgGraphic = '';
  if (cfg.backgroundPattern === 'hex') {
    bgGraphic = `
      <polygon points="100,20 180,65 180,155 100,200 20,155 20,65" fill="${pal.secondary}" stroke="${pal.primary}" stroke-width="2" opacity="0.45"/>
      <polygon points="100,40 160,75 160,145 100,180 40,145 40,75" fill="none" stroke="${pal.accent}" stroke-width="1" opacity="0.25" stroke-dasharray="4,4"/>
    `;
  } else if (cfg.backgroundPattern === 'radar') {
    bgGraphic = `
      <circle cx="100" cy="100" r="85" fill="${pal.secondary}" stroke="${pal.primary}" stroke-width="2" opacity="0.5"/>
      <circle cx="100" cy="100" r="60" fill="none" stroke="${pal.accent}" stroke-width="1" opacity="0.35"/>
      <line x1="15" y1="100" x2="185" y2="100" stroke="${pal.primary}" stroke-width="1" opacity="0.25"/>
      <line x1="100" y1="15" x2="100" y2="185" stroke="${pal.primary}" stroke-width="1" opacity="0.25"/>
    `;
  } else {
    bgGraphic = `
      <rect x="15" y="15" width="170" height="170" rx="16" fill="${pal.secondary}" stroke="${pal.primary}" stroke-width="2" opacity="0.5"/>
      <line x1="20" y1="50" x2="180" y2="50" stroke="${pal.primary}" stroke-width="0.5" opacity="0.2"/>
      <line x1="20" y1="80" x2="180" y2="80" stroke="${pal.primary}" stroke-width="0.5" opacity="0.2"/>
      <line x1="20" y1="110" x2="180" y2="110" stroke="${pal.primary}" stroke-width="0.5" opacity="0.2"/>
      <line x1="20" y1="140" x2="180" y2="140" stroke="${pal.primary}" stroke-width="0.5" opacity="0.2"/>
    `;
  }

  // Head and Neck base
  const bodyBase = `
    <!-- Neck & Shoulders -->
    <path d="M70,160 L60,200 L140,200 L130,160 Z" fill="#181816" stroke="${pal.primary}" stroke-width="1.5"/>
    <path d="M80,165 L100,185 L120,165" fill="none" stroke="${pal.accent}" stroke-width="2" opacity="0.6"/>
    <!-- Face / Head Base -->
    <polygon points="100,45 142,65 146,120 128,155 100,165 72,155 54,120 58,65" fill="#20201D" stroke="${pal.primary}" stroke-width="2"/>
    <!-- Cyber Ear Plates -->
    <rect x="50" y="90" width="8" height="24" rx="2" fill="${pal.primary}" opacity="0.9"/>
    <rect x="142" y="90" width="8" height="24" rx="2" fill="${pal.primary}" opacity="0.9"/>
  `;

  // Headgear
  let headgearSvg = '';
  switch (cfg.headgear) {
    case 'mohawk':
      headgearSvg = `
        <polygon points="100,10 115,48 85,48" fill="${pal.primary}"/>
        <polygon points="98,15 108,50 88,50" fill="${pal.accent}"/>
        <line x1="100" y1="12" x2="100" y2="46" stroke="#FFFFFF" stroke-width="2"/>
      `;
      break;
    case 'undercut':
      headgearSvg = `
        <path d="M56,66 C65,30 135,32 144,66 C130,50 80,48 56,66 Z" fill="${pal.primary}"/>
        <line x1="62" y1="72" x2="80" y2="60" stroke="${pal.accent}" stroke-width="2"/>
        <line x1="65" y1="80" x2="85" y2="68" stroke="${pal.accent}" stroke-width="2"/>
      `;
      break;
    case 'cowl':
      headgearSvg = `
        <path d="M50,110 C45,35 155,35 150,110 C140,48 60,48 50,110 Z" fill="#141413" stroke="${pal.primary}" stroke-width="2.5"/>
        <path d="M60,50 L100,30 L140,50" fill="none" stroke="${pal.accent}" stroke-width="1.5" stroke-dasharray="3,3"/>
      `;
      break;
    case 'headset':
      headgearSvg = `
        <path d="M48,90 C45,35 155,35 152,90" fill="none" stroke="#FFFFFF" stroke-width="3"/>
        <circle cx="50" cy="98" r="12" fill="#141413" stroke="${pal.primary}" stroke-width="2.5"/>
        <circle cx="150" cy="98" r="12" fill="#141413" stroke="${pal.primary}" stroke-width="2.5"/>
        <path d="M50,102 L75,120" stroke="${pal.primary}" stroke-width="2"/>
        <circle cx="76" cy="121" r="3" fill="${pal.accent}"/>
      `;
      break;
    case 'slick':
      headgearSvg = `
        <path d="M54,68 C70,36 130,36 146,68 L142,54 C125,32 75,32 58,54 Z" fill="${pal.primary}"/>
      `;
      break;
  }

  // Visor / Optics
  let visorSvg = '';
  switch (cfg.visor) {
    case 'cyber_visor':
      visorSvg = `
        <polygon points="62,82 138,82 134,104 66,104" fill="${pal.primary}" opacity="0.85"/>
        <line x1="66" y1="93" x2="134" y2="93" stroke="#FFFFFF" stroke-width="2"/>
        <text x="70" y="101" font-size="6" fill="#000000" font-family="monospace" font-weight="bold">HUD // 2077</text>
      `;
      break;
    case 'mono_scanner':
      visorSvg = `
        <!-- Left eye normal -->
        <circle cx="82" cy="95" r="4" fill="${pal.accent}"/>
        <!-- Right eye tech scanner -->
        <circle cx="118" cy="95" r="12" fill="#121212" stroke="${pal.primary}" stroke-width="2.5"/>
        <circle cx="118" cy="95" r="6" fill="${pal.primary}"/>
        <circle cx="118" cy="95" r="2" fill="#FFFFFF"/>
        <line x1="106" y1="95" x2="130" y2="95" stroke="${pal.accent}" stroke-width="0.8"/>
        <line x1="118" y1="83" x2="118" y2="107" stroke="${pal.accent}" stroke-width="0.8"/>
      `;
      break;
    case 'shades':
      visorSvg = `
        <polygon points="65,86 96,86 92,106 68,104" fill="#0A0A0A" stroke="${pal.primary}" stroke-width="1.5"/>
        <polygon points="104,86 135,86 132,104 108,106" fill="#0A0A0A" stroke="${pal.primary}" stroke-width="1.5"/>
        <line x1="96" y1="89" x2="104" y2="89" stroke="${pal.primary}" stroke-width="2"/>
      `;
      break;
    case 'bionic':
      visorSvg = `
        <circle cx="82" cy="95" r="5" fill="${pal.primary}"/>
        <circle cx="82" cy="95" r="2" fill="#FFFFFF"/>
        <circle cx="118" cy="95" r="5" fill="${pal.primary}"/>
        <circle cx="118" cy="95" r="2" fill="#FFFFFF"/>
        <line x1="72" y1="95" x2="77" y2="95" stroke="${pal.accent}" stroke-width="1.5"/>
        <line x1="123" y1="95" x2="128" y2="95" stroke="${pal.accent}" stroke-width="1.5"/>
      `;
      break;
    case 'none':
      visorSvg = `
        <ellipse cx="82" cy="95" rx="5" ry="3" fill="#FFFFFF"/>
        <circle cx="82" cy="95" r="2" fill="${pal.primary}"/>
        <ellipse cx="118" cy="95" rx="5" ry="3" fill="#FFFFFF"/>
        <circle cx="118" cy="95" r="2" fill="${pal.primary}"/>
      `;
      break;
  }

  // Masks
  let maskSvg = '';
  switch (cfg.mask) {
    case 'breather':
      maskSvg = `
        <polygon points="82,125 118,125 125,158 100,165 75,158" fill="#141413" stroke="${pal.primary}" stroke-width="2"/>
        <circle cx="88" cy="142" r="7" fill="#20201D" stroke="${pal.accent}" stroke-width="1.5"/>
        <circle cx="112" cy="142" r="7" fill="#20201D" stroke="${pal.accent}" stroke-width="1.5"/>
        <line x1="97" y1="142" x2="103" y2="142" stroke="${pal.primary}" stroke-width="2"/>
      `;
      break;
    case 'collar':
      maskSvg = `
        <path d="M68,145 Q100,165 132,145 L138,172 Q100,185 62,172 Z" fill="#181816" stroke="${pal.primary}" stroke-width="2"/>
        <line x1="85" y1="158" x2="115" y2="158" stroke="${pal.accent}" stroke-width="1.5"/>
      `;
      break;
    case 'matrix_mask':
      maskSvg = `
        <polygon points="80,122 120,122 115,155 85,155" fill="#101010" stroke="${pal.accent}" stroke-width="1.5"/>
        <line x1="84" y1="130" x2="116" y2="130" stroke="${pal.primary}" stroke-width="1" stroke-dasharray="2,2"/>
        <line x1="84" y1="138" x2="116" y2="138" stroke="${pal.primary}" stroke-width="1" stroke-dasharray="2,2"/>
        <line x1="84" y1="146" x2="116" y2="146" stroke="${pal.primary}" stroke-width="1" stroke-dasharray="2,2"/>
      `;
      break;
    case 'none':
      maskSvg = `
        <!-- Natural mouth line with cyber lip accent -->
        <line x1="90" y1="138" x2="110" y2="138" stroke="#FFFFFF" stroke-width="1.5" opacity="0.6"/>
        <circle cx="106" cy="138" r="1.5" fill="${pal.primary}"/>
      `;
      break;
  }

  // Implants
  let implantSvg = '';
  switch (cfg.implant) {
    case 'neural_jack':
      implantSvg = `
        <rect x="132" y="80" width="8" height="14" rx="2" fill="#101010" stroke="${pal.accent}" stroke-width="1.5"/>
        <circle cx="136" cy="85" r="1.5" fill="${pal.primary}"/>
        <circle cx="136" cy="90" r="1.5" fill="${pal.primary}"/>
      `;
      break;
    case 'cheek_leds':
      implantSvg = `
        <polyline points="68,112 76,112 82,120" fill="none" stroke="${pal.primary}" stroke-width="1.5"/>
        <circle cx="82" cy="120" r="2" fill="${pal.accent}"/>
      `;
      break;
    case 'barcode':
      implantSvg = `
        <rect x="70" y="112" width="1.5" height="8" fill="${pal.primary}"/>
        <rect x="73" y="112" width="3" height="8" fill="${pal.primary}"/>
        <rect x="78" y="112" width="1.5" height="8" fill="${pal.primary}"/>
        <rect x="81" y="112" width="2" height="8" fill="${pal.primary}"/>
      `;
      break;
    case 'none':
      break;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%" style="background:#0D0D0C; border-radius:14px; overflow:hidden;">
    <defs>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    ${bgGraphic}
    ${bodyBase}
    ${implantSvg}
    ${maskSvg}
    ${visorSvg}
    ${headgearSvg}
    <!-- Outer Cyber Border Accent -->
    <rect x="1" y="1" width="198" height="198" rx="14" fill="none" stroke="${pal.primary}" stroke-width="1.5" opacity="0.6"/>
  </svg>`;
}

export function svgToDataUri(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}
