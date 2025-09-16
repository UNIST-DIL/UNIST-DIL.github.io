// Fix DOM matches function
if (!Element.prototype.matches) {
  Element.prototype.matches =
    Element.prototype.matchesSelector ||
    Element.prototype.mozMatchesSelector ||
    Element.prototype.msMatchesSelector ||
    Element.prototype.oMatchesSelector ||
    Element.prototype.webkitMatchesSelector ||
    function(s) {
      var matches = (this.document || this.ownerDocument).querySelectorAll(s),
        i = matches.length;
      while (--i >= 0 && matches.item(i) !== this) {}
      return i > -1;
    };
}

// Get Scroll position
function getScrollPos() {
  var supportPageOffset = window.pageXOffset !== undefined;
  var isCSS1Compat = ((document.compatMode || "") === "CSS1Compat");

  var x = supportPageOffset ? window.pageXOffset : isCSS1Compat ? document.documentElement.scrollLeft : document.body.scrollLeft;
  var y = supportPageOffset ? window.pageYOffset : isCSS1Compat ? document.documentElement.scrollTop : document.body.scrollTop;

  return { x: x, y: y };
}

var _scrollTimer = [];

// Smooth scroll
function smoothScrollTo(y, time) {
  time = time == undefined ? 500 : time;

  var scrollPos = getScrollPos();
  var count = 60;
  var length = (y - scrollPos.y);

  function easeInOut(k) {
    return .5 * (Math.sin((k - .5) * Math.PI) + 1);
  }

  for (var i = _scrollTimer.length - 1; i >= 0; i--) {
    clearTimeout(_scrollTimer[i]);
  }

  for (var i = 0; i <= count; i++) {
    (function() {
      var cur = i;
      _scrollTimer[cur] = setTimeout(function() {
        window.scrollTo(
          scrollPos.x,
          scrollPos.y + length * easeInOut(cur/count)
        );
      }, (time / count) * cur);
    })();
  }
}

// modification for DIL website

document.addEventListener('DOMContentLoaded', function () {
  var banner = document.querySelector('.banner');
  if (!banner) return;

  var cfg = window.BANNER_SLIDESHOW || {};
  var imgs = Array.isArray(cfg.images) ? cfg.images.slice() : [];
  if (!imgs.length) return;

  // 배너가 <img>일 수도, background-image일 수도 있어 둘 다 지원
  var imgEl = banner.querySelector('img');

  function currentBackgroundUrl() {
    var bg = getComputedStyle(banner).backgroundImage || '';
    return bg.replace(/^url\(["']?|["']?\)$/g,'');
  }

  // 초기 URL
  var initialUrl = imgEl ? (imgEl.currentSrc || imgEl.src) : currentBackgroundUrl();
  if (initialUrl && !imgs.includes(initialUrl)) imgs.unshift(initialUrl);

  // 상태
  var idx = 0;
  if (cfg.random_start) idx = Math.floor(Math.random() * imgs.length);
  var playing = true;
  var timer = null;

  // 유틸
  function setBanner(url) {
    if (imgEl) {
      imgEl.src = url;
    } else {
      banner.style.backgroundImage = "url('" + url + "')";
      banner.style.backgroundSize = "cover";
      banner.style.backgroundPosition = "center";
    }
    try { localStorage.setItem('DILAB_BANNER', url); } catch(e){}
  }
  function showIndex(i) {
    idx = (i + imgs.length) % imgs.length;
    setBanner(imgs[idx]);
  }
  function start() {
    stop();
    var interval = Math.max(1000, cfg.interval_ms || 5000);
    timer = setInterval(function () {
      showIndex(idx + 1); // ← 지정한 배열 순서대로 순차 전환
    }, interval);
    playing = true; updatePlayBtn();
  }
  function stop() {
    if (timer) clearInterval(timer);
    timer = null; playing = false; updatePlayBtn();
  }

  // 저장된 사용자 선택 복원
  try {
    var saved = localStorage.getItem('DILAB_BANNER');
    if (saved && imgs.includes(saved)) {
      showIndex(imgs.indexOf(saved));
    } else {
      showIndex(idx);
    }
  } catch(e){ showIndex(idx); }

  // 컨트롤 UI
  var controls = document.createElement('div');
  controls.className = 'banner-controls';
  controls.innerHTML = `
    <button class="banner-btn" data-act="prev">◀ Prev</button>
    <button class="banner-btn" data-act="play">Pause ⏸</button>
    <button class="banner-btn" data-act="next">Next ▶</button>
    <label class="banner-btn" data-act="upload">Choose Image<input type="file" accept="image/*"></label>
    <button class="banner-btn" data-act="reset">Reset</button>
  `;
  banner.appendChild(controls);

  var playBtn = controls.querySelector('[data-act="play"]');
  function updatePlayBtn() {
    playBtn.textContent = playing ? 'Pause ⏸' : 'Play ▶';
  }

  controls.addEventListener('click', function (e) {
    var act = e.target.getAttribute('data-act');
    if (!act) return;
    if (act === 'prev') {
      stop(); showIndex(idx - 1);
    } else if (act === 'next') {
      stop(); showIndex(idx + 1);
    } else if (act === 'play') {
      playing ? stop() : start();
    } else if (act === 'reset') {
      stop();
      try { localStorage.removeItem('DILAB_BANNER'); } catch(e){}
      showIndex(0); // 설정 리스트의 첫 이미지로
    }
  });

  // 업로드(로컬 파일을 DataURL로 표시; 서버 업로드 없음)
  var fileInput = controls.querySelector('input[type="file"]');
  fileInput.addEventListener('change', function () {
    var f = this.files && this.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      var dataUrl = ev.target.result;
      imgs.push(dataUrl);
      showIndex(imgs.length - 1);
      stop(); // 사용자가 선택한 이미지를 보고 있도록 자동재생 잠시 멈춤
    };
    reader.readAsDataURL(f);
    this.value = ''; // 같은 파일 다시 선택 가능하도록 초기화
  });

  // 자동 시작
  start();
});
