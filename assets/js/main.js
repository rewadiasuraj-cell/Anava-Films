// ANAVA FILMS - Core Scripts v4.0 Final Release
function initApp() {
  initThemeToggle();
  initMobileMenu();
  initClapboardIntro();
  initHeaderScroll();
  initShowreel();
  initWorkFilters();
  initModals();
  initContactForm();
  initLogoIntroTrigger();
  initVideoThumbnails();
  initTestimonialTabs();
  initTstmSlider();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

/* --------------------------------------------------------------------------
   0. Dark Theme Enforcer
   -------------------------------------------------------------------------- */
function initThemeToggle() {
  localStorage.removeItem('anava-theme');
  document.documentElement.setAttribute('data-theme', 'dark');
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', 'dark');
}

/* --------------------------------------------------------------------------
   1. Mobile Navigation Drawer Toggle (Global & Unbreakable)
   -------------------------------------------------------------------------- */
window.toggleMobileMenu = function(e) {
  if (e) {
    if (e.stopPropagation) e.stopPropagation();
  }
  const menuBtn = document.getElementById('mobile-menu-btn');
  const nav = document.querySelector('.main-nav');
  const header = document.querySelector('.main-header');

  if (!menuBtn || !nav) return;

  const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
  const nextState = !isExpanded;

  menuBtn.setAttribute('aria-expanded', nextState ? 'true' : 'false');
  menuBtn.classList.toggle('active', nextState);
  nav.classList.toggle('mobile-active', nextState);
  if (header) header.classList.toggle('mobile-menu-open', nextState);
  document.body.classList.toggle('no-scroll', nextState);
};

window.closeMobileMenu = function() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const nav = document.querySelector('.main-nav');
  const header = document.querySelector('.main-header');

  if (menuBtn) {
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.classList.remove('active');
  }
  if (nav) nav.classList.remove('mobile-active');
  if (header) header.classList.remove('mobile-menu-open');
  document.body.classList.remove('no-scroll');
};

function initMobileMenu() {
  const nav = document.querySelector('.main-nav');
  if (!nav) return;

  const navLinks = nav.querySelectorAll('.nav-link, .mobile-nav-cta, a');
  navLinks.forEach(link => {
    link.addEventListener('click', window.closeMobileMenu);
  });

  document.addEventListener('click', (e) => {
    const menuBtn = document.getElementById('mobile-menu-btn');
    if (nav.classList.contains('mobile-active')) {
      if (!nav.contains(e.target) && menuBtn && !menuBtn.contains(e.target)) {
        window.closeMobileMenu();
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('mobile-active')) {
      window.closeMobileMenu();
    }
  });
}

/* --------------------------------------------------------------------------
   1.5 Galaxy Stardust Background Particles Renderer
   -------------------------------------------------------------------------- */
function initGalaxyParticles(introEl) {
  const canvas = document.getElementById('intro-particles-canvas');
  if (!canvas) return null;

  const ctx = canvas.getContext('2d');
  let animationFrameId = null;
  let width = (canvas.width = introEl.clientWidth || window.innerWidth);
  let height = (canvas.height = introEl.clientHeight || window.innerHeight);

  const numParticles = Math.min(85, Math.max(40, Math.floor((width * height) / 12000)));
  const particles = [];

  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.4,
      baseAlpha: Math.random() * 0.55 + 0.15,
      vx: (Math.random() - 0.5) * 0.22,
      vy: -(Math.random() * 0.35 + 0.12),
      pulseSpeed: Math.random() * 0.025 + 0.01,
      angle: Math.random() * Math.PI * 2
    });
  }

  function handleResize() {
    if (!canvas || !introEl) return;
    width = canvas.width = introEl.clientWidth || window.innerWidth;
    height = canvas.height = introEl.clientHeight || window.innerHeight;
  }

  window.addEventListener('resize', handleResize);

  function render() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.pulseSpeed;

      // Wrap particle coordinates continuously
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      // Pulsing alpha for galaxy star twinkle
      const currentAlpha = p.baseAlpha + Math.sin(p.angle) * 0.18;
      const safeAlpha = Math.max(0.05, Math.min(0.9, currentAlpha));

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${safeAlpha})`;
      ctx.shadowBlur = p.radius > 1.2 ? 6 : 2;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
      ctx.fill();
    }

    animationFrameId = requestAnimationFrame(render);
  }

  render();

  return function stopParticles() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', handleResize);
  };
}

/* --------------------------------------------------------------------------
   2. Cinematic Clapboard Intro Animation (Session-based, 3-4s max, skippable)
   -------------------------------------------------------------------------- */
function initClapboardIntro() {
  const introEl = document.getElementById('cinematic-intro');
  if (!introEl) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const forceReplay = sessionStorage.getItem('force_intro_replay') === 'true' || window.location.search.includes('intro=');
  const introAlreadyPlayed = sessionStorage.getItem('anava_intro_played') === 'true';

  if (forceReplay) {
    sessionStorage.removeItem('force_intro_replay');
  } else if (prefersReducedMotion || introAlreadyPlayed) {
    introEl.style.display = 'none';
    return;
  }

  let isDismissed = false;
  const activeTimeouts = [];

  function safeTimeout(fn, ms) {
    const id = setTimeout(fn, ms);
    activeTimeouts.push(id);
    return id;
  }

  let stopParticles = null;

  function dismissIntro() {
    if (isDismissed) return;
    isDismissed = true;
    activeTimeouts.forEach(id => clearTimeout(id));
    if (typeof stopParticles === 'function') {
      try { stopParticles(); } catch (e) {}
    }

    try {
      sessionStorage.setItem('anava_intro_played', 'true');
    } catch (e) {}

    introEl.classList.add('dissolving');
    setTimeout(() => {
      introEl.style.display = 'none';
    }, 700);
  }

  // Hard safety fallback: Ensure intro NEVER blocks website for more than 8.2s under any circumstances
  setTimeout(() => {
    dismissIntro();
  }, 8200);

  // Click/Tap anywhere on intro screen to skip immediately
  introEl.addEventListener('click', dismissIntro);

  try {
    stopParticles = initGalaxyParticles(introEl);

    const skipBtn = document.getElementById('skip-intro-btn');
    const phraseStage = document.getElementById('intro-phrase-stage');
    const phraseText = document.getElementById('intro-phrase-text');

    const logoStage = document.getElementById('intro-logo-stage');
    const logoWrapper = document.querySelector('.intro-logo-wrapper');
    const logoSweep = document.getElementById('intro-logo-sweep');
    const tagline = document.getElementById('intro-tagline');

    if (skipBtn) skipBtn.addEventListener('click', dismissIntro);

    // Studio Title Sequence (8.0s Total Duration)
    const phrases = [
      { text: 'A THOUGHT', duration: 750 },
      { text: 'AN IDEA', duration: 750 },
      { text: 'A DECK', duration: 750 },
      { text: 'A SHOOT', duration: 750 },
      { text: 'A FILM', duration: 1100 } // Climax hold
    ];

    function runPhraseSequence(index) {
      if (isDismissed || !phraseText) return;

      if (index >= phrases.length) {
        // Transition from last phrase ("A FILM") into Logo Reveal Stage
        if (phraseStage) phraseStage.style.display = 'none';

        if (logoStage) {
          logoStage.style.display = 'flex';
          if (logoWrapper) {
            logoWrapper.offsetHeight; // reflow
            logoWrapper.classList.add('visible');
          }

          // Subliminal light sweep across logo
          safeTimeout(() => {
            if (isDismissed || !logoSweep) return;
            logoSweep.classList.add('animate-sweep');
          }, 250);

          // Tagline reveal
          safeTimeout(() => {
            if (isDismissed || !tagline) return;
            tagline.classList.add('visible');
          }, 500);

          // Final smooth dissolve into site hero after 1.85s logo reveal
          safeTimeout(() => {
            dismissIntro();
          }, 1850);
        } else {
          dismissIntro();
        }
        return;
      }

      const currentItem = phrases[index];
      phraseText.textContent = currentItem.text;
      phraseText.classList.remove('fade-out');
      phraseText.offsetHeight; // reflow
      phraseText.classList.add('visible');

      // Hold current phrase, then optical focus pull & exposure fade out
      safeTimeout(() => {
        if (isDismissed) return;
        phraseText.classList.remove('visible');
        phraseText.classList.add('fade-out');

        // Next phrase transition after optical focus out (300ms)
        safeTimeout(() => {
          runPhraseSequence(index + 1);
        }, 300);
      }, currentItem.duration);
    }

    // Start sequence at t=250ms
    safeTimeout(() => {
      runPhraseSequence(0);
    }, 250);
  } catch (err) {
    console.error('Intro animation error:', err);
    dismissIntro();
  }
}

/* --------------------------------------------------------------------------
   3. Header Scroll Effect
   -------------------------------------------------------------------------- */
function initHeaderScroll() {
  const header = document.querySelector('.main-header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 45) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/* --------------------------------------------------------------------------
   4. Showreel Video Autoplay on Scroll + Unmute Control
   -------------------------------------------------------------------------- */
function initShowreel() {
  const showreelVideo = document.getElementById('showreel-player');
  const showreelBg = document.querySelector('.showreel-video-bg');
  const soundToggle = document.getElementById('showreel-sound-toggle');
  if (!showreelVideo) return;

  showreelVideo.muted = true;
  showreelVideo.playsInline = true;

  if (showreelBg) {
    showreelBg.muted = true;
    showreelBg.playsInline = true;
  }

  // IntersectionObserver to play when in viewport
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          showreelVideo.play().catch(() => {});
          if (showreelBg) showreelBg.play().catch(() => {});
        } else {
          showreelVideo.pause();
          if (showreelBg) showreelBg.pause();
        }
      });
    }, { threshold: 0.25 });
    observer.observe(showreelVideo);
  }

  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      showreelVideo.muted = !showreelVideo.muted;
      soundToggle.innerHTML = showreelVideo.muted 
        ? `<span>🔊</span> UNMUTE SHOWREEL`
        : `<span>🔇</span> MUTE AUDIO`;
    });
  }
}

/* --------------------------------------------------------------------------
   5. CMS / Centralized Data Model for All Projects
   -------------------------------------------------------------------------- */
window.projectsData = {
  'lenskart-hustler': {
    id: 'lenskart-hustler',
    title: 'Hustler — Keep Hustling',
    client: 'Lenskart',
    category: 'tvc',
    subcategories: ['social', 'performance'],
    format: 'TVC / Commercial Ad Film',
    roles: ['Creative Direction', 'Ideation', 'Production', 'Direction', 'Post-Production'],
    thumbVideo: 'assets/media/tvc/LENSKART HUSTLER AD FILM.mp4',
    videoSrc: 'assets/media/tvc/LENSKART HUSTLER AD FILM.mp4',
    shortDesc: 'High-octane commercial ad film built around energy, attitude, and momentum.',
    thought: 'How do you launch a bold, razor-sharp eyewear range that speaks directly to creators, athletes and everyday hustlers without sounding like generic sportswear?',
    idea: '“Keep Hustling” — A rhythm-driven cinematic narrative where eyewear is not an accessory, but armor for ambition.',
    making: 'Shot with high-speed anamorphic optics, custom strobe cues, fast-paced set transitions and custom mastered urban soundscapes.'
  },
  'john-jacobs': {
    id: 'john-jacobs',
    title: 'John Jacobs — An Eye for Love',
    client: 'John Jacobs',
    category: 'tvc',
    subcategories: ['social'],
    format: 'TVC / Commercial Ad Film',
    roles: ['Creative Direction', 'Scripting', 'Production', 'Direction'],
    thumbVideo: 'assets/media/tvc/LENSKART JOHN JACBOS EYEWEAR (FILM ).mp4',
    videoSrc: 'assets/media/tvc/LENSKART JOHN JACBOS EYEWEAR (FILM ).mp4',
    shortDesc: 'Atmospheric romantic commercial focusing on visual chemistry and subtle eye contact.',
    thought: 'Eye contact is where quiet luxury and intimate connection begin. How do we make optical frames evoke pure romance?',
    idea: '“An Eye for Love” — A tender, visually opulent narrative capturing stolen glances and architectural romance.',
    making: 'Curated warm palette, vintage prime lenses, soft natural lighting and poetic blocking to emphasize every gaze.'
  },
  'karan-johar-kusha': {
    id: 'karan-johar-kusha',
    title: 'Karan Johar & Kusha Kapila x Lenskart',
    client: 'Lenskart',
    category: 'vertical',
    subcategories: ['social', 'product'],
    format: 'Vertical Social Film / Celebrity Reel',
    roles: ['Creative Direction', 'Celebrity Direction', 'Scripting', 'Production'],
    thumbVideo: 'assets/media/vertical-films/KARAN JOHAR & KUSHA KAPILA X LENSKART FILM 03.mp4',
    videoSrc: 'assets/media/vertical-films/KARAN JOHAR & KUSHA KAPILA X LENSKART FILM 03.mp4',
    shortDesc: 'Witty celebrity dialogue film engineered for high-converting social media feeds.',
    thought: 'Combining celebrity star power with sharp comedy in a vertical 9:16 format.',
    idea: 'Witty, fast-paced dialogue between Karan Johar and Kusha Kapila showcasing eyewear fashion.',
    making: 'Dual camera setup tailored for high-engagement mobile feeds and instant social conversion.'
  },
  'orry-kfc': {
    id: 'orry-kfc',
    title: 'Orry & KFC Commercial',
    client: 'KFC India',
    category: 'vertical',
    subcategories: ['social', 'performance'],
    format: 'Vertical Commercial / Viral Social Ad',
    roles: ['Creative Direction', 'Production', 'Direction', 'Post-Production'],
    thumbVideo: 'assets/media/vertical-films/ORRY & KFC.mp4',
    videoSrc: 'assets/media/vertical-films/ORRY & KFC.mp4',
    shortDesc: 'Pop-culture viral commercial featuring internet icon Orry with energetic food styling.',
    thought: 'Capturing internet pop culture icon Orry in an energetic KFC campaign.',
    idea: 'A quirky, vibrant social film with bold pop-up aesthetics and viral pacing.',
    making: 'High-contrast studio lighting, quick-cut editing, and custom sound design.'
  },
  'kfc-jitesh': {
    id: 'kfc-jitesh',
    title: 'KFC x Jitesh Sharma (RCB)',
    client: 'KFC / Royal Challengers Bangalore',
    category: 'vertical',
    subcategories: ['social', 'performance'],
    format: 'Vertical Sports Commercial',
    roles: ['Creative Direction', 'Production', 'Direction'],
    thumbVideo: 'assets/media/vertical-films/KFC X JITESH SHARMA ( RCB).mp4',
    videoSrc: 'assets/media/vertical-films/KFC X JITESH SHARMA ( RCB).mp4',
    shortDesc: 'Fast-paced sports commercial merging IPL cricket energy with craveable food crunch.',
    thought: 'Fusing IPL cricket excitement with craveable KFC crunch.',
    idea: 'A fast-paced player commercial showcasing Jitesh Sharma enjoying KFC favorites.',
    making: 'Shot in studio environment with sports lighting and high-speed food cinematography.'
  },
  'thumbsup-zaid': {
    id: 'thumbsup-zaid',
    title: 'Thumbs Up x Zaid Darbar',
    client: 'Thumbs Up',
    category: 'vertical',
    subcategories: ['social'],
    format: 'Vertical Action & Dance Reel',
    roles: ['Creative Direction', 'Choreography', 'Production', 'Direction'],
    thumbVideo: 'assets/media/vertical-films/THUMBS UP X ZAID DARBAR FILM.mp4',
    videoSrc: 'assets/media/vertical-films/THUMBS UP X ZAID DARBAR FILM.mp4',
    shortDesc: 'Action-packed energy for the iconic Thumbs Up brand.',
    thought: 'Action-packed energy for the iconic Thumbs Up brand.',
    idea: 'High-intensity stunt & motion sequence featuring Zaid Darbar.',
    making: 'Dynamic tracking shots, speed ramps, and punchy audio mastering.'
  },
  'lenskart-inf-03': {
    id: 'lenskart-inf-03',
    title: 'Lenskart Influencers Campaign #03',
    client: 'Lenskart',
    category: 'vertical',
    subcategories: ['performance', 'catalogue'],
    format: 'Performance Ad Film',
    roles: ['Creative Direction', 'Production', 'Post-Production'],
    thumbVideo: 'assets/media/performance-films/LENSKART INFLUENCERS ( FILM) 03.mp4',
    videoSrc: 'assets/media/performance-films/LENSKART INFLUENCERS ( FILM) 03.mp4',
    shortDesc: 'High-converting social ad tailored for fashion performance marketing.',
    thought: 'High-converting social ads require high visual standards and clear product focus.',
    idea: 'Close-up fashion influencer styling tailored for performance marketing.',
    making: 'Studio lighting setup optimized for color accuracy and product texture.'
  },
  'lenskart-inf-05': {
    id: 'lenskart-inf-05',
    title: 'Lenskart Influencers Campaign #05',
    client: 'Lenskart',
    category: 'vertical',
    subcategories: ['performance', 'catalogue'],
    format: 'Performance Ad Film',
    roles: ['Creative Direction', 'Production', 'Post-Production'],
    thumbVideo: 'assets/media/performance-films/LENSKART INFLUENCERS ( FILM) 05.mp4',
    videoSrc: 'assets/media/performance-films/LENSKART INFLUENCERS ( FILM) 05.mp4',
    shortDesc: 'Dynamic model transitions highlighting frame shapes and lens reflections.',
    thought: 'Highlighting eyewear versatility across different fashion styles.',
    idea: 'Dynamic model transitions highlighting frame shapes and lens reflections.',
    making: 'Rapid lighting changes and precision color grading.'
  },
  'lenskart-inf-18': {
    id: 'lenskart-inf-18',
    title: 'Lenskart Influencers Campaign #18',
    client: 'Lenskart',
    category: 'vertical',
    subcategories: ['performance', 'product'],
    format: 'Performance Ad Film',
    roles: ['Creative Direction', 'Production', 'Post-Production'],
    thumbVideo: 'assets/media/performance-films/LENSKART INFLUENCERS ( FILM) 18.mp4',
    videoSrc: 'assets/media/performance-films/LENSKART INFLUENCERS ( FILM) 18.mp4',
    shortDesc: 'Bold model poses and crisp eyewear close-ups engineered for clicks.',
    thought: 'Creating thumb-stopping visual hooks in the first 2 seconds.',
    idea: 'Bold model poses and crisp eyewear close-ups.',
    making: 'Shot on cinema prime lenses with soft beauty lighting.'
  },
  'lenskart-superman-1': {
    id: 'lenskart-superman-1',
    title: 'Lenskart x Superman Launch',
    client: 'Lenskart / Warner Bros',
    category: 'tvc',
    subcategories: ['social', 'product'],
    format: 'Event & Commercial Launch Film',
    roles: ['Creative Direction', 'Production', 'Direction', 'Editing'],
    thumbVideo: 'assets/media/event-films/LENSKART X SUPERMAN MOVIE.mp4',
    videoSrc: 'assets/media/event-films/LENSKART X SUPERMAN MOVIE.mp4',
    shortDesc: 'Cinematic event film showcasing celebrity guests, launch installations, and crowd reaction.',
    thought: 'Capturing the grand unveil of the Lenskart x Superman collection.',
    idea: 'Cinematic event film showcasing celebrity guests, launch installations, and crowd reaction.',
    making: 'Multi-camera live event coverage with gimbal tracking and atmosphere shots.'
  },
  'lenskart-superman-2': {
    id: 'lenskart-superman-2',
    title: 'Lenskart x Superman Experience Film',
    client: 'Lenskart / Warner Bros',
    category: 'tvc',
    subcategories: ['social'],
    format: 'Experiential Brand Film',
    roles: ['Event Coverage', 'Direction', 'Post-Production'],
    thumbVideo: 'assets/media/event-films/LENSKART X SUPERMAN MOVIE-2.mp4',
    videoSrc: 'assets/media/event-films/LENSKART X SUPERMAN MOVIE-2.mp4',
    shortDesc: 'Slick recap featuring red carpet interviews, visual displays, and product reveals.',
    thought: 'Immersive highlights of the Superman brand experience venue.',
    idea: 'Slick recap featuring red carpet interviews, visual displays, and product reveals.',
    making: 'Low-light prime lenses, live audio recording, and high-beat editing.'
  },
  'wow-brand-content': {
    id: 'wow-brand-content',
    title: 'WOW Skin Science — Brand Content & Stories',
    client: 'WOW Skin Science',
    category: 'testimonials',
    subcategories: ['product', 'social'],
    format: 'Brand Content / Testimonial Film',
    roles: ['Creative Direction', 'Production', 'Direction', 'Post-Production'],
    thumbVideo: 'assets/media/testimonials/WOW TESTIMONIAL .mp4',
    videoSrc: 'assets/media/testimonials/WOW TESTIMONIAL .mp4',
    shortDesc: 'Organic personal care narrative highlighting botanical formulation and authentic skin stories.',
    thought: 'How do you communicate nature-infused skincare with pure scientific clarity?',
    idea: 'A warm, sensorial film combining macro ingredient shots with real customer testimonials.',
    making: 'Specialized macro probe lenses for ingredient textures paired with intimate natural lighting.'
  },
  'indus-valley-brand': {
    id: 'indus-valley-brand',
    title: 'Indus Valley — Organic Hair & Skin Campaign',
    client: 'Indus Valley',
    category: 'photoshoots',
    subcategories: ['catalogue', 'product'],
    format: 'Brand Visuals & Photoshoots',
    roles: ['Creative Direction', 'Art Direction', 'Production'],
    thumbVideo: 'assets/media/performance-films/LENSKART INFLUENCERS ( FILM) 18.mp4',
    videoSrc: 'assets/media/performance-films/LENSKART INFLUENCERS ( FILM) 18.mp4',
    shortDesc: 'Editorial product shoot and campaign assets for organic personal care brand.',
    thought: 'Showcasing pure bio-organic ingredients with editorial premium minimalism.',
    idea: 'Clean, earthy tones with tactile plant elements and soft morning sunlight.',
    making: 'Studio tabletop setup with organic botanical props and high-resolution medium format captures.'
  },
  'aqualens-campaign': {
    id: 'aqualens-campaign',
    title: 'Aqualens — Comfort in Every Blink',
    client: 'Aqualens',
    category: 'photoshoots',
    subcategories: ['catalogue', 'performance', 'product'],
    format: 'Photoshoots / Performance Ads / Catalogue',
    roles: ['Creative Direction', 'Production', 'Art Direction'],
    thumbVideo: 'assets/media/testimonials/LENSKART TESTIMONIAL  (1).mp4',
    videoSrc: 'assets/media/testimonials/LENSKART TESTIMONIAL  (1).mp4',
    shortDesc: 'High-clarity catalogue and performance ad suite for daily contact lenses.',
    thought: 'Contact lenses need to look fresh, hydrating, and effortless all day long.',
    idea: 'Water-ripple aesthetics with bright, refreshing micro-lighting on eye models.',
    making: 'High-speed liquid splashing photography combined with extreme macro eye portraiture.'
  },
  'fikn-performance': {
    id: 'fikn-performance',
    title: 'FIKN — High-Conversion Performance Suite',
    client: 'FIKN',
    category: 'vertical',
    subcategories: ['performance', 'social'],
    format: 'Performance Ad Series',
    roles: ['Creative Direction', 'Scripting', 'Production', 'Post-Production'],
    thumbVideo: 'assets/media/testimonials/LENSKART TESTIMONIAL  (2).mp4',
    videoSrc: 'assets/media/testimonials/LENSKART TESTIMONIAL  (2).mp4',
    shortDesc: 'Direct-response video ads structured with 3-second hooks and strong conversion CTAs.',
    thought: 'Converting mobile shoppers requires immediate problem-solution storytelling.',
    idea: 'Punchy typography overlays, instant relatable hooks, and clear product demonstrations.',
    making: 'Agile studio shooting with rapid A/B hook variations and platform-optimized color grades.'
  },
  'podcast-simplai': {
    id: 'podcast-simplai',
    title: 'SimplAI — Tech & AI Podcast Series',
    client: 'SimplAI',
    category: 'podcasts',
    subcategories: ['social'],
    format: 'Studio Podcast & Multi-Cam Broadcast',
    roles: ['Studio Setup', 'Multi-Cam Production', 'Audio Mastering', 'Editing'],
    thumbVideo: 'assets/media/podcast/Podcast.mp4',
    videoSrc: 'assets/media/podcast/Podcast.mp4',
    shortDesc: 'Studio broadcast and multi-camera setup designed for AI and technology founders.',
    thought: 'Designing a sleek, intimate studio broadcast setup for deep tech conversations.',
    idea: '3-camera angles with dynamic live switching, subtle warm rim lights, and broadcast audio.',
    making: 'Acoustically tuned studio space, cinema camera package, and custom LUT color pipeline.'
  },
  'music-video-space': {
    id: 'music-video-space',
    title: 'I Need My Space — Music Video',
    client: 'Independent Artist / Anava',
    category: 'tvc',
    subcategories: ['social'],
    format: 'Official Music Video',
    roles: ['Creative Direction', 'Scripting', 'Production', 'Direction', 'Color Grading'],
    thumbVideo: 'assets/media/music-video/song-music-video.mp4',
    videoSrc: 'assets/media/music-video/song-music-video.mp4',
    shortDesc: 'Moody visual narrative blending neon shadows, slow motion, and silhouette framing.',
    thought: 'Visualizing solitude and emotional space through atmospheric cinema.',
    idea: 'A moody visual narrative blending neon shadows, slow motion, and silhouette framing.',
    making: 'Shot in anamorphic format with custom color science and stylized visual effects.'
  },
  'testimonial-lenskart-1': {
    id: 'testimonial-lenskart-1',
    title: 'Lenskart Partner Testimonial',
    client: 'Lenskart Leadership',
    category: 'testimonials',
    subcategories: ['social'],
    format: 'Client Testimonial Film',
    roles: ['Interview Production', 'Direction', 'Editing'],
    thumbVideo: 'assets/media/testimonials/LENSKART TESTIMONIAL FILM.mp4',
    videoSrc: 'assets/media/testimonials/LENSKART TESTIMONIAL FILM.mp4',
    shortDesc: 'How Jackson and Anjan turn a one-line thought into a complete shoot deck.',
    thought: 'Authentic brand storytelling from the client’s perspective.',
    idea: 'Clean interview lighting and crisp audio focusing on trust and creative collaboration.',
    making: '2-camera sit-down interview with soft studio lighting.'
  },
  'bts-lenskart-perf': {
    id: 'bts-lenskart-perf',
    title: 'BTS: Lenskart Performance Shoot',
    client: 'Anava Production House',
    category: 'tvc',
    subcategories: ['social'],
    format: 'Behind The Scenes Documentary',
    roles: ['Production Management', 'Cinematography', 'Editing'],
    thumbVideo: 'assets/media/behind-the-scenes/BEHIND THE SCENES SHOOT FOR LENSKART X PERFORMANCE FILM.mp4',
    videoSrc: 'assets/media/behind-the-scenes/BEHIND THE SCENES SHOOT FOR LENSKART X PERFORMANCE FILM.mp4',
    shortDesc: 'Raw footage showing how a high-end commercial comes together behind the lens.',
    thought: 'Showing how a high-end commercial comes together behind the lens.',
    idea: 'Raw, energetic footage of director, lighting crew, camera team, and talent on set.',
    making: 'Run-and-gun documentary style shot alongside the main commercial crew.'
  }
};

/* --------------------------------------------------------------------------
   6. Work Page Primary & Secondary Filtering (Client-side, no reload)
   -------------------------------------------------------------------------- */
function initWorkFilters() {
  const primaryTabBtns = document.querySelectorAll('.work-tab-btn, .filter-btn');
  const dropdownToggleBtn = document.getElementById('vertical-dropdown-btn');
  const dropdownItems = document.querySelectorAll('.dropdown-item');
  const workItems = document.querySelectorAll('.work-card-item, .work-card');

  if (!workItems.length) return;

  let currentPrimary = 'all';
  let currentSecondary = 'all';

  function applyFilters() {
    workItems.forEach(item => {
      let matchPrimary = (currentPrimary === 'all' || itemCat === currentPrimary);
      let matchSecondary = true;

      if (currentPrimary === 'vertical' && currentSecondary !== 'all') {
        matchSecondary = itemSubCats.includes(currentSecondary);
      }

      if (matchPrimary && matchSecondary) {
        item.style.display = item.classList.contains('work-card-item') ? 'flex' : 'block';
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      } else {
        item.style.display = 'none';
      }
    });
  }

  primaryTabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (btn.classList.contains('dropdown-toggle-btn')) {
        // Toggle dropdown on mobile/click
        const menu = document.getElementById('vertical-dropdown-menu');
        if (menu) menu.classList.toggle('show');
      }

      primaryTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      currentPrimary = btn.getAttribute('data-filter') || 'all';
      if (currentPrimary !== 'vertical') {
        currentSecondary = 'all';
        dropdownItems.forEach(di => di.classList.remove('active'));
        const allSubBtn = document.querySelector('.dropdown-item[data-subfilter="all"]');
        if (allSubBtn) allSubBtn.classList.add('active');
      }
      applyFilters();
    });
  });

  dropdownItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const sub = item.getAttribute('data-subfilter');

      dropdownItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      primaryTabBtns.forEach(b => b.classList.remove('active'));
      if (dropdownToggleBtn) dropdownToggleBtn.classList.add('active');

      const menu = document.getElementById('vertical-dropdown-menu');
      if (menu) menu.classList.remove('show');

      currentPrimary = 'vertical';
      currentSecondary = sub;
      applyFilters();
    });
  });

  applyFilters();
}

/* --------------------------------------------------------------------------
   7. Reusable Individual Project Page / Modal Component (Item 8)
   -------------------------------------------------------------------------- */
function initModals() {
  const modalBackdrop = document.getElementById('case-modal');
  const modalContainer = document.getElementById('modal-dynamic-body');
  const closeBtn = document.getElementById('modal-close-btn');

  if (!modalBackdrop) return;

  // Click trigger for all work cards
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-open-case]');
    if (!trigger) return;

    e.preventDefault();
    const caseId = trigger.getAttribute('data-open-case');
    const data = (window.projectsData && window.projectsData[caseId]) || {
      title: trigger.getAttribute('data-title') || 'Featured Project',
      client: 'Anava Client',
      format: 'Brand Film / Commercial',
      roles: ['Creative Direction', 'Production', 'Direction', 'Post-Production'],
      thought: 'Taking an initial thought and transforming it into a high-impact film.',
      idea: 'Tailored storytelling built specifically for brand resonance and audience engagement.',
      making: 'End-to-end shoot execution with dedicated lighting, camera department and mastering.',
      videoSrc: 'assets/media/tvc/LENSKART HUSTLER AD FILM.mp4'
    };

    renderProjectModal(data);
    modalBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  function renderProjectModal(data) {
    if (!modalContainer) return;

    const isDirectVideo = data.videoSrc && (data.videoSrc.endsWith('.mp4') || data.videoSrc.endsWith('.mov') || data.videoSrc.endsWith('.webm'));

    const videoPlayerHtml = isDirectVideo 
      ? `<video src="${data.videoSrc}" controls autoplay playsinline style="width: 100%; height: 100%; object-fit: contain; background: #000; border-radius: 12px;"></video>`
      : `<iframe src="${data.videoSrc}" style="width: 100%; height: 100%; border: none;" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;

    modalContainer.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        <span style="color: var(--accent-gold); font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em;">${data.format}</span>
        <h2 style="font-family: var(--font-display); font-size: clamp(1.8rem, 3.5vw, 2.5rem); font-weight: 800; margin-top: 0.4rem; line-height: 1.2;">${data.title}</h2>
      </div>

      <!-- Meta Row: CLIENT / FORMAT / ANAVA'S ROLE -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1.2rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border-light); padding: 1rem 1.4rem; border-radius: 8px; margin-bottom: 2rem;">
        <div>
          <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em;">CLIENT</div>
          <div style="font-size: 1rem; font-weight: 700; color: #fff; margin-top: 0.2rem;">${data.client}</div>
        </div>
        <div>
          <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em;">FORMAT</div>
          <div style="font-size: 0.95rem; font-weight: 600; color: var(--accent-gold); margin-top: 0.2rem;">${data.format}</div>
        </div>
        <div style="grid-column: 1 / -1;">
          <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.4rem;">ANAVA’S ROLE</div>
          <div class="role-badges" style="margin-top: 0;">
            ${data.roles.map(r => `<span class="role-badge" style="background: rgba(245, 183, 25, 0.15); color: var(--accent-gold); border-color: rgba(245, 183, 25, 0.35); font-size: 0.75rem;">${r}</span>`).join('')}
          </div>
        </div>
      </div>

      <!-- 4 CONTENT BLOCKS: THE FINAL FILM (Prominent Top), THE THOUGHT, THE IDEA, THE MAKING -->
      <div style="margin-bottom: 2.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
          <h4 style="color: var(--accent-gold); font-family: var(--font-display); font-size: 1rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">THE FINAL FILM</h4>
          <span style="font-size: 0.75rem; color: var(--text-muted);">HD Playback</span>
        </div>
        <div style="position: relative; aspect-ratio: 16/9; background: #000; border-radius: 12px; overflow: hidden; border: 1px solid var(--border-light); box-shadow: 0 10px 40px rgba(0,0,0,0.6);">
          ${videoPlayerHtml}
        </div>
      </div>

      <div style="display: grid; gap: 1.8rem; border-top: 1px solid var(--border-light); padding-top: 2rem;">
        <div>
          <h4 style="color: var(--accent-gold); font-family: var(--font-display); font-size: 1.15rem; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">THE THOUGHT (CLIENT BRIEF)</h4>
          <p style="color: var(--text-muted); line-height: 1.65; margin-top: 0.4rem; font-size: 0.95rem;">${data.thought}</p>
        </div>

        <div>
          <h4 style="color: var(--accent-gold); font-family: var(--font-display); font-size: 1.15rem; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">THE IDEA (ANAVA'S CONCEPT)</h4>
          <p style="color: var(--text-muted); line-height: 1.65; margin-top: 0.4rem; font-size: 0.95rem;">${data.idea}</p>
        </div>

        <div>
          <h4 style="color: var(--accent-gold); font-family: var(--font-display); font-size: 1.15rem; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">THE MAKING (EXECUTION)</h4>
          <p style="color: var(--text-muted); line-height: 1.65; margin-top: 0.4rem; font-size: 0.95rem;">${data.making}</p>
        </div>
      </div>
    `;
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop.classList.contains('active')) {
      closeModal();
    }
  });

  function closeModal() {
    modalBackdrop.classList.remove('active');
    document.body.style.overflow = 'auto';
    if (modalContainer) modalContainer.innerHTML = '';
  }
}

/* --------------------------------------------------------------------------
   8. Testimonial Grouping Tabs (Clients, Line Producers, ADs, Directors, Editors, Cinematographers)
   -------------------------------------------------------------------------- */
function initTestimonialTabs() {
  const testimonialTabs = document.querySelectorAll('.testimonial-group-tab');
  const testimonialCards = document.querySelectorAll('.testimonial-respondent-card');

  if (!testimonialTabs.length) return;

  testimonialTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      testimonialTabs.forEach(t => {
        t.classList.remove('active', 'btn-primary');
        t.classList.add('btn-outline');
      });
      tab.classList.remove('btn-outline');
      tab.classList.add('active', 'btn-primary');

      const selectedGroup = tab.getAttribute('data-group');

      testimonialCards.forEach(card => {
        const cardGroup = card.getAttribute('data-respondent-group');
        if (selectedGroup === 'all' || selectedGroup === cardGroup) {
          card.style.display = 'flex';
          setTimeout(() => { card.style.opacity = '1'; }, 20);
        } else {
          card.style.opacity = '0';
          setTimeout(() => { card.style.display = 'none'; }, 200);
        }
      });
    });
  });
}

/* --------------------------------------------------------------------------
   9. Contact Form & Email Automation
   -------------------------------------------------------------------------- */
function initContactForm() {
  const form = document.getElementById('anava-contact-form');
  const feedbackEl = document.getElementById('form-feedback');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    const name = document.getElementById('client-name')?.value.trim();
    const email = document.getElementById('client-email')?.value.trim();
    const projectTypeSelect = document.getElementById('project-type');
    const projectType = projectTypeSelect ? projectTypeSelect.options[projectTypeSelect.selectedIndex].text : 'General Inquiry';
    const message = document.getElementById('thought-message')?.value.trim();

    submitBtn.innerHTML = `<span>Sending Thought...</span>`;
    submitBtn.disabled = true;

    try {
      const response = await fetch('https://formsubmit.co/ajax/office@anavafilms.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `New Production Inquiry: ${name} (${projectType})`,
          _template: 'table',
          _captcha: 'false',
          "Client Name / Brand": name,
          "Email Address": email,
          "Project / Content Type": projectType,
          "Thought & Objective": message
        })
      });

      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      form.reset();

      if (feedbackEl) {
        feedbackEl.style.display = 'block';
        feedbackEl.innerHTML = `
          <div style="background: rgba(245, 183, 25, 0.15); border: 1px solid var(--accent-gold); padding: 1.2rem; border-radius: 8px; color: #fff; font-size: 0.95rem; margin-top: 1rem;">
            ✨ <strong>Thought Received!</strong> Your message has been sent to office@anavafilms.com. We’ll review your thought and get back to you with ideas to shoot within 24 hours.
          </div>
        `;

        setTimeout(() => {
          feedbackEl.style.display = 'none';
        }, 8000);
      }
    } catch (err) {
      console.error('Email submission error:', err);
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      form.reset();

      if (feedbackEl) {
        feedbackEl.style.display = 'block';
        feedbackEl.innerHTML = `
          <div style="background: rgba(245, 183, 25, 0.15); border: 1px solid var(--accent-gold); padding: 1.2rem; border-radius: 8px; color: #fff; font-size: 0.95rem; margin-top: 1rem;">
            ✨ <strong>Thought Received!</strong> We’ll review your thought and get back to you with ideas to shoot within 24 hours.
          </div>
        `;
        setTimeout(() => {
          feedbackEl.style.display = 'none';
        }, 8000);
      }
    }
  });
}

/* --------------------------------------------------------------------------
   10. Header Logo Click Trigger (Replay Intro)
   -------------------------------------------------------------------------- */
function initLogoIntroTrigger() {
  const brandLogos = document.querySelectorAll('.brand-logo');
  brandLogos.forEach(logo => {
    logo.addEventListener('click', (e) => {
      sessionStorage.removeItem('anava_intro_played');
      sessionStorage.setItem('force_intro_replay', 'true');
    });
  });
}

/* --------------------------------------------------------------------------
   11. Automatic In-Thumbnail Video Autoplay (Continuous Smooth Video Previews)
   -------------------------------------------------------------------------- */
function initVideoThumbnails() {
  const videoElements = document.querySelectorAll('.work-card video, .work-thumb-wrapper video, .collab-card video, .work-card-item video, .work-card-media video, .work-card-video, .work-thumb-img, .tstm-card video, .tstm-card-video');
  
  if (!videoElements.length) return;

  const playVideo = (video) => {
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('autoplay', '');

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Handle initial browser autoplay policies gracefully
      });
    }
  };

  // IntersectionObserver to play visible videos & pause offscreen ones for performance
  if ('IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target.tagName === 'VIDEO' ? entry.target : entry.target.querySelector('video');
        if (!video) return;

        if (entry.isIntersecting) {
          video.preload = 'auto';
          playVideo(video);
        } else {
          video.pause();
        }
      });
    }, { rootMargin: '200px 0px', threshold: 0.01 });

    videoElements.forEach(video => {
      const parent = video.closest('.work-card-item, .work-card, .collab-card, .work-thumb-wrapper') || video;
      videoObserver.observe(parent);
      playVideo(video);
    });
  } else {
    videoElements.forEach(video => playVideo(video));
  }

  // Fallback triggers for first user interaction if blocked by restrictive autoplay policies
  const tryAutoplayAll = () => {
    videoElements.forEach(video => {
      if (video.paused) {
        playVideo(video);
      }
    });
  };

  ['click', 'touchstart', 'scroll', 'mousemove'].forEach(evt => {
    window.addEventListener(evt, tryAutoplayAll, { once: true, passive: true });
  });
}

/* Interactive Tab Switching for WHAT WE DO Dashboard */
window.switchWwdTab = function(tabName) {
  const tabs = document.querySelectorAll('.wwd-step-tab');
  const panels = document.querySelectorAll('.wwd-pillar-panel');
  
  tabs.forEach(tab => {
    if (tab.getAttribute('data-target') === tabName + '-tab') {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  panels.forEach(panel => {
    if (panel.id === tabName + '-tab') {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  const heroLines = document.querySelector('.wwd-hero-three-lines');
  if (heroLines) {
    if (tabName === 'think') {
      heroLines.innerHTML = '<span class="line-gold">THINK.</span><span class="line-white">MAKE.</span><span class="line-white">FINISH.</span>';
    } else if (tabName === 'make') {
      heroLines.innerHTML = '<span class="line-white">THINK.</span><span class="line-gold">MAKE.</span><span class="line-white">FINISH.</span>';
    } else {
      heroLines.innerHTML = '<span class="line-white">THINK.</span><span class="line-white">MAKE.</span><span class="line-gold">FINISH.</span>';
    }
  }
};

/* Testimonials Carousel Slider Arrow Controls */
function initTstmSlider() {
  const prevBtn = document.getElementById('tstm-prev');
  const nextBtn = document.getElementById('tstm-next');
  const track = document.getElementById('tstm-track');
  if (!track) return;

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      track.scrollBy({ left: -340, behavior: 'smooth' });
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      track.scrollBy({ left: 340, behavior: 'smooth' });
    });
  }
}
