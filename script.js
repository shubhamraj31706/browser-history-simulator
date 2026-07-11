// ----- Data structures: two stacks implemented as arrays -----
let backStack = [];
let forwardStack = [];
let currentPage = null; // null = about:blank, no history yet

// ----- DOM references -----
const backBtn = document.getElementById('backBtn');
const forwardBtn = document.getElementById('forwardBtn');
const navForm = document.getElementById('navForm');
const urlInput = document.getElementById('urlInput');
const currentPageEl = document.getElementById('currentPage');
const backWell = document.getElementById('backWell');
const forwardWell = document.getElementById('forwardWell');
const backCount = document.getElementById('backCount');
const forwardCount = document.getElementById('forwardCount');
const pageContent = document.getElementById('pageContent');
const pageFrame = document.getElementById('pageFrame');
const frameBlocked = document.getElementById('frameBlocked');
const blockedPageName = document.getElementById('blockedPageName');

let loadTimer = null; // detects whether the iframe actually rendered

// Turns "wikipedia.org/stacks" into a real, loadable URL
function normalizeUrl(value) {
  if (/^https?:\/\//i.test(value)) return value;
  return 'https://' + value;
}

// ----- Core stack operations -----

function visit(page) {
  if (!page) return;
  if (currentPage !== null) {
    backStack.push(currentPage); // push old page onto back stack
  }
  currentPage = page;
  forwardStack = []; // new navigation clears forward history
  render();
}

function goBack() {
  if (backStack.length === 0) return;
  forwardStack.push(currentPage);   // push current page onto forward stack
  currentPage = backStack.pop();    // pop last page off back stack
  render();
}

function goForward() {
  if (forwardStack.length === 0) return;
  backStack.push(currentPage);         // push current page onto back stack
  currentPage = forwardStack.pop();    // pop last page off forward stack
  render();
}

// ----- Rendering -----

function renderStack(stack, wellEl, emptyMessage) {
  wellEl.innerHTML = '';
  if (stack.length === 0) {
    const p = document.createElement('p');
    p.className = 'empty-note';
    p.textContent = emptyMessage;
    wellEl.appendChild(p);
    return;
  }
  // show top of stack first (most recent), reverse array for display
  const displayOrder = [...stack].reverse();
  displayOrder.forEach((page, i) => {
    const div = document.createElement('div');
    div.className = 'ticket' + (i === 0 ? ' top' : '');
    div.textContent = page;
    wellEl.appendChild(div);
  });
}

// Tries to actually show the live page. If the site refuses to be
// embedded (X-Frame-Options / CSP frame-ancestors), we fall back to an
// explanation panel — the page still stays in history either way.
function loadPreview(page) {
  clearTimeout(loadTimer);
  pageFrame.hidden = true;
  frameBlocked.hidden = true;

  pageFrame.onload = () => {
    clearTimeout(loadTimer);
    pageFrame.hidden = false;
    frameBlocked.hidden = true;
  };
  pageFrame.src = normalizeUrl(page);

  // Sites that block embedding never fire a normal load inside — if
  // nothing renders within this window, assume it's blocked.
  loadTimer = setTimeout(() => {
    pageFrame.hidden = true;
    frameBlocked.hidden = false;
    blockedPageName.textContent = page;
  }, 1800);
}

function render() {
  currentPageEl.textContent = currentPage || 'about:blank';
  backBtn.disabled = backStack.length === 0;
  forwardBtn.disabled = forwardStack.length === 0;
  backCount.textContent = backStack.length;
  forwardCount.textContent = forwardStack.length;
  renderStack(backStack, backWell, 'empty — nothing to go back to');
  renderStack(forwardStack, forwardWell, 'empty — go back first');
  urlInput.value = '';

  if (currentPage) {
    pageContent.hidden = true;
    loadPreview(currentPage);
  } else {
    clearTimeout(loadTimer);
    pageContent.hidden = false;
    pageFrame.hidden = true;
    frameBlocked.hidden = true;
    pageFrame.src = 'about:blank';
  }
}

// ----- Event listeners -----

navForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const value = urlInput.value.trim();
  if (value) visit(value);
});

backBtn.addEventListener('click', goBack);
forwardBtn.addEventListener('click', goForward);

// Initial render
render();