import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

// SVG para Ícone PWA e Logomarca FluencIA (512x512)
const fluenciaMasterSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Gradiente de Fundo Principal -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3730A3" />
      <stop offset="35%" stop-color="#4F46E5" />
      <stop offset="75%" stop-color="#6366F1" />
      <stop offset="100%" stop-color="#7C3AED" />
    </linearGradient>

    <!-- Brilho de IA de fundo -->
    <radialGradient id="aiBackGlow" cx="65%" cy="32%" r="60%">
      <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.4" />
      <stop offset="40%" stop-color="#C084FC" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#4F46E5" stop-opacity="0" />
    </radialGradient>

    <!-- Gradiente da Estrela de IA -->
    <linearGradient id="sparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047" />
      <stop offset="50%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#FB7185" />
    </linearGradient>

    <!-- Gradiente das Ondas da Fala -->
    <linearGradient id="wave1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>
    <linearGradient id="wave2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#34D399" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <linearGradient id="wave3" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FBBF24" />
      <stop offset="100%" stop-color="#D97706" />
    </linearGradient>
    <linearGradient id="wave4" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#F472B6" />
      <stop offset="100%" stop-color="#DB2777" />
    </linearGradient>
    <linearGradient id="wave5" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#C084FC" />
      <stop offset="100%" stop-color="#9333EA" />
    </linearGradient>

    <!-- Sombra suave para o balão -->
    <filter id="softShadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#1E1B4B" flood-opacity="0.38"/>
    </filter>

    <!-- Filtro de brilho intenso na estrela IA -->
    <filter id="sparkleGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Fundo Squircle Suave -->
  <rect width="512" height="512" rx="128" fill="url(#bgGrad)" />
  <rect width="512" height="512" rx="128" fill="url(#aiBackGlow)" />

  <!-- Partículas sutis de IA no fundo -->
  <circle cx="95" cy="120" r="6" fill="#BAE6FD" opacity="0.6" />
  <circle cx="410" cy="110" r="8" fill="#FDE047" opacity="0.7" />
  <circle cx="85" cy="390" r="7" fill="#F472B6" opacity="0.5" />
  <circle cx="430" cy="380" r="6" fill="#6EE7B7" opacity="0.6" />

  <!-- Balão de Fala Principal (Voz / Comunicação) -->
  <g filter="url(#softShadow)">
    <path d="M 120 120
             C 120 86, 148 60, 184 60
             L 328 60
             C 364 60, 392 86, 392 120
             L 392 260
             C 392 294, 364 320, 328 320
             L 220 320
             L 155 375
             C 142 386, 120 376, 120 358
             Z"
          fill="#FFFFFF" />
  </g>

  <!-- Ondas Sonoras da Fluência Vocal (5 Barras Harmônicas) -->
  <g transform="translate(10, 0)">
    <!-- Barra 1 (Agilidade/Início) -->
    <rect x="156" y="165" width="20" height="70" rx="10" fill="url(#wave1)" />
    <!-- Barra 2 (Cadência) -->
    <rect x="194" y="135" width="20" height="130" rx="10" fill="url(#wave2)" />
    <!-- Barra 3 (Ritmo Central) -->
    <rect x="232" y="105" width="20" height="180" rx="10" fill="url(#wave3)" />
    <!-- Barra 4 (Prosódia) -->
    <rect x="270" y="130" width="20" height="140" rx="10" fill="url(#wave4)" />
    <!-- Barra 5 (Expressão) -->
    <rect x="308" y="160" width="20" height="80" rx="10" fill="url(#wave5)" />
  </g>

  <!-- Curva do Sorriso / Conexão Empática Infantil -->
  <path d="M 195 272 Q 256 298 317 272" stroke="#6366F1" stroke-width="7" stroke-linecap="round" fill="none" opacity="0.85" />

  <!-- ESTRELA DE IA (Destaque FluencIA) -->
  <g filter="url(#sparkleGlow)" transform="translate(365, 78)">
    <!-- Grande Estrela Radiante de 4 pontas -->
    <path d="M 0 -48 
             Q 0 0 48 0 
             Q 0 0 0 48 
             Q 0 0 -48 0 
             Q 0 0 0 -48 Z" 
          fill="url(#sparkleGrad)" />
    <circle cx="0" cy="0" r="10" fill="#FFFFFF" />
  </g>

  <!-- Mini estrela IA de apoio -->
  <g transform="translate(422, 142) scale(0.45)">
    <path d="M 0 -36 Q 0 0 36 0 Q 0 0 0 36 Q 0 0 -36 0 Q 0 0 0 -36 Z" fill="#FDE047" opacity="0.9" />
  </g>

  <!-- Badge / Monograma "IA" no canto inferior com estilo moderno de inteligência artificial -->
  <g transform="translate(256, 436)">
    <rect x="-92" y="-24" width="184" height="48" rx="24" fill="#0F172A" opacity="0.88" />
    <rect x="-92" y="-24" width="184" height="48" rx="24" fill="none" stroke="#6366F1" stroke-width="2" opacity="0.6" />
    
    <!-- Texto FLUENC + IA -->
    <text x="-16" y="8" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="20" fill="#FFFFFF" letter-spacing="1.5" text-anchor="middle">
      FLUENC
    </text>
    <text x="52" y="8" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="20" fill="#FBBF24" letter-spacing="1" text-anchor="middle">
      IA
    </text>
    <circle cx="70" cy="-6" r="3" fill="#38BDF8" />
  </g>
</svg>`;

// Favicon SVG (otimizado para visualização nítida em abas de navegadores, 32px e 64px)
const fluenciaFaviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="64" height="64">
  <defs>
    <linearGradient id="bgFav" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4338CA" />
      <stop offset="60%" stop-color="#6366F1" />
      <stop offset="100%" stop-color="#7C3AED" />
    </linearGradient>
    <linearGradient id="aiStar" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047" />
      <stop offset="100%" stop-color="#F59E0B" />
    </linearGradient>
  </defs>

  <!-- Fundo -->
  <rect width="512" height="512" rx="128" fill="url(#bgFav)" />

  <!-- Balão de Fala Branco Nítido -->
  <path d="M 110 110
           C 110 75, 140 50, 180 50
           L 332 50
           C 372 50, 402 75, 402 110
           L 402 260
           C 402 295, 372 320, 332 320
           L 220 320
           L 150 380
           C 136 392, 110 380, 110 360
           Z"
        fill="#FFFFFF" />

  <!-- Ondas Vocais com Alto Contraste -->
  <rect x="156" y="170" width="24" height="70" rx="12" fill="#0284C7" />
  <rect x="198" y="130" width="24" height="145" rx="12" fill="#059669" />
  <rect x="240" y="95" width="24" height="200" rx="12" fill="#D97706" />
  <rect x="282" y="130" width="24" height="145" rx="12" fill="#DB2777" />
  <rect x="324" y="165" width="24" height="85" rx="12" fill="#7C3AED" />

  <!-- Estrela IA de Alto Brilho e Destaque -->
  <g transform="translate(385, 75)">
    <path d="M 0 -58 Q 0 0 58 0 Q 0 0 0 58 Q 0 0 -58 0 Q 0 0 0 -58 Z" fill="url(#aiStar)" />
    <circle cx="0" cy="0" r="14" fill="#FFFFFF" />
  </g>

  <!-- Detalhe 'IA' em texto estilizado -->
  <text x="256" y="445" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="44" fill="#FFFFFF" text-anchor="middle" letter-spacing="3">
    Fluenc<tspan fill="#FBBF24">IA</tspan>
  </text>
</svg>`;

// Maskable Icon SVG (com margem de segurança de 15% nas bordas para crop circular/quadrado do Android)
const fluenciaMaskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3730A3" />
      <stop offset="40%" stop-color="#4F46E5" />
      <stop offset="80%" stop-color="#6366F1" />
      <stop offset="100%" stop-color="#7C3AED" />
    </linearGradient>
    <linearGradient id="aiSparkleM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047" />
      <stop offset="50%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#FB7185" />
    </linearGradient>
  </defs>

  <!-- Fundo Preenchido Integral (sem rx para maskable) -->
  <rect width="512" height="512" fill="url(#bgMask)" />

  <!-- Conteúdo escalado para zona segura central (80%) -->
  <g transform="translate(51, 46) scale(0.8)">
    <!-- Balão de Fala -->
    <path d="M 120 120
             C 120 86, 148 60, 184 60
             L 328 60
             C 364 60, 392 86, 392 120
             L 392 260
             C 392 294, 364 320, 328 320
             L 220 320
             L 155 375
             C 142 386, 120 376, 120 358
             Z"
          fill="#FFFFFF" />

    <!-- Ondas Sonoras -->
    <rect x="166" y="165" width="20" height="70" rx="10" fill="#0284C7" />
    <rect x="204" y="135" width="20" height="130" rx="10" fill="#059669" />
    <rect x="242" y="105" width="20" height="180" rx="10" fill="#D97706" />
    <rect x="280" y="130" width="20" height="140" rx="10" fill="#DB2777" />
    <rect x="318" y="160" width="20" height="80" rx="10" fill="#9333EA" />

    <!-- Sorriso de Fluência -->
    <path d="M 205 272 Q 266 298 327 272" stroke="#6366F1" stroke-width="7" stroke-linecap="round" fill="none" opacity="0.85" />

    <!-- Estrela de IA -->
    <g transform="translate(370, 78)">
      <path d="M 0 -48 Q 0 0 48 0 Q 0 0 0 48 Q 0 0 -48 0 Q 0 0 0 -48 Z" fill="url(#aiSparkleM)" />
      <circle cx="0" cy="0" r="10" fill="#FFFFFF" />
    </g>
    <g transform="translate(422, 142) scale(0.45)">
      <path d="M 0 -36 Q 0 0 36 0 Q 0 0 0 36 Q 0 0 -36 0 Q 0 0 0 -36 Z" fill="#FDE047" />
    </g>

    <!-- Logo Monograma FluencIA -->
    <g transform="translate(256, 440)">
      <rect x="-92" y="-24" width="184" height="48" rx="24" fill="#0F172A" opacity="0.9" />
      <text x="-16" y="8" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="20" fill="#FFFFFF" letter-spacing="1.5" text-anchor="middle">
        FLUENC
      </text>
      <text x="52" y="8" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="20" fill="#FBBF24" letter-spacing="1" text-anchor="middle">
        IA
      </text>
    </g>
  </g>
</svg>`;

async function generateAssets() {
  console.log('Gerando SVGs do FluencIA...');
  
  // Salva SVGs
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), fluenciaFaviconSvg, 'utf-8');
  fs.writeFileSync(path.join(publicDir, 'pwa-192x192.svg'), fluenciaMasterSvg, 'utf-8');
  fs.writeFileSync(path.join(publicDir, 'pwa-512x512.svg'), fluenciaMasterSvg, 'utf-8');

  console.log('Convertendo e exportando PNGs com Sharp...');

  // 1. PWA 192x192 PNG
  await sharp(Buffer.from(fluenciaMasterSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  // 2. PWA 512x512 PNG
  await sharp(Buffer.from(fluenciaMasterSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  // 3. Apple Touch Icon (180x180)
  await sharp(Buffer.from(fluenciaMasterSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 4. Maskable Icon (512x512)
  await sharp(Buffer.from(fluenciaMaskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'maskable-icon-512x512.png'));

  console.log('✅ Todos os ícones do FluencIA gerados com sucesso!');
}

generateAssets().catch(err => {
  console.error('Erro gerando ícones:', err);
  process.exit(1);
});
