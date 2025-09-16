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
  var cfg = (window.BANNER_SLIDESHOW || {});
  var imgs = Array.isArray(cfg.images) ? cfg.images : [];
  if (!imgs.length) return;

  // 배너 DOM 탐색 (Yat에서 .banner 요소 또는 내부 img 사용)
  var banner = document.querySelector('.banner');
  if (!banner) return;
  var imgEl = banner.querySelector('img');

  // 부드럽게 보이도록 미리 로드
  imgs.forEach(function (u) { var i = new Image(); i.src = u; });

  function setBanner(url) {
    if (imgEl) {
      imgEl.src = url;
    } else {
      banner.style.backgroundImage = "url('" + url + "')";
      banner.style.backgroundSize = 'cover';
      banner.style.backgroundPosition = 'center';
    }
  }

  var idx = 0;
  if (cfg.random_start) idx = Math.floor(Math.random() * imgs.length);
  setBanner(imgs[idx]);

  var interval = Math.max(1000, (cfg.interval_ms || 5000));
  setInterval(function () {
    idx = (idx + 1) % imgs.length;
    setBanner(imgs[idx]);
  }, interval);
});

document.addEventListener('DOMContentLoaded', function () {
  var banner = document.querySelector('.banner');
  if (!banner) return;

  // 배너가 <img>를 쓸 수도, background-image를 쓸 수도 있어 둘 다 지원
  var imgEl = banner.querySelector('img');

  // 목록/초기 이미지
  var cfg = (window.BANNER_SLIDESHOW || {});
  var imgs = Array.isArray(cfg.images) ? cfg.images.slice() : [];
  // 현재 배너를 목록에 포함(중복 방지)
  var currentUrl = imgEl ? imgEl.src : (getComputedStyle(banner).backgroundImage || '').replace(/^url\(["']?|["']?\)$/g,'');
  if (currentUrl && !imgs.includes(currentUrl)) imgs.unshift(currentUrl);

  // 유틸
  function setBanner(url) {
    if (imgEl) { imgEl.src = url; }
    else {
      banner.style.backgroundImage = "url('" + url + "')";
      banner.style.backgroundSize = 'cover';
      banner.style.backgroundPosition = 'center';
    }
    try { localStorage.setItem('DILAB_BANNER', url); } catch(e){}
  }

  // 저장된 사용자 선택 복원
  try {
    var saved = localStorage.getItem('DILAB_BANNER');
    if (saved) setBanner(saved);
  } catch(e){}

  // 컨트롤 UI
  var controls = document.createElement('div');
  controls.className = 'banner-controls';
  controls.innerHTML = `
    <button class="banner-btn" data-act="prev">◀ Prev</button>
    <button class="banner-btn" data-act="next">Next ▶</button>
    <label class="banner-btn" data-act="upload">Choose Image<input type="file" accept="image/*"></label>
    <button class="banner-btn" data-act="reset">Reset</button>
  `;
  banner.style.position = banner.style.position || 'relative';
  banner.appendChild(controls);

  // 현재 인덱스
  var idx = Math.max(0, imgs.indexOf(saved || currentUrl));

  // 이벤트
  controls.addEventListener('click', function (e) {
    var act = e.target.getAttribute('data-act');
    if (!act) return;
    if (!imgs.length) return;

    if (act === 'prev') {
      idx = (idx - 1 + imgs.length) % imgs.length;
      setBanner(imgs[idx]);
    } else if (act === 'next') {
      idx = (idx + 1) % imgs.length;
      setBanner(imgs[idx]);
    } else if (act === 'reset') {
      try { localStorage.removeItem('DILAB_BANNER'); } catch(e){}
      setBanner(imgs[0]); idx = 0;
    }
  });

  // 파일 업로드(클라이언트 로컬 미리보기)
  var fileInput = controls.querySelector('input[type="file"]');
  fileInput.addEventListener('change', function () {
    var f = this.files && this.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      var dataUrl = ev.target.result;
      // 목록에 추가하고 표시
      imgs.push(dataUrl);
      idx = imgs.length - 1;
      setBanner(dataUrl);
    };
    reader.readAsDataURL(f);
  });
});

