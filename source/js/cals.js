'use strict';

(function(){
const dateL = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric'
})
const dateS = new Intl.DateTimeFormat(undefined, {
  month: "numeric",
  day: "numeric"
})
async function getFetch(url) {
  let res = {}
  if (topbar) topbar.show()
  try {
    const response = await fetch(url)
    if (response.ok) res = await response.json()
    if (topbar) topbar.hide()
    return res
  } catch ({ name, message }) {
    console.log(name, message)
    if (topbar) topbar.hide()
    return {}
  }
}
// pass in a date object and get 'YYYY-MM-DD' string
function getYYYYMMDD (date) {
  let yyyy = date.getFullYear().toString();
  let mm = (date.getMonth()+1).toString();
  let dd = date.getDate().toString();
  return yyyy + '-' + padWithZeroes(mm) + '-' + padWithZeroes(dd);
}
function padWithZeroes (x) {
  return (+x < 10) ? '0' + x : x;
}
function generateCalendar(tar) {
  // SPACING includes square size and gutters
  const SPACING = 13;
  const SQUARE_SIZE = 10;
  const MARKED_DAY_COLOR = '#52BA69';
  const UNMARKED_DAY_COLOR = '#eee';
  // takes x coord and month name as string
  function drawMonthText(x, month) {
    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('class', 'monthname');
    text.setAttribute('y', '-5');
    text.setAttribute('x', x);
    const mthName = document.createTextNode(month);
    text.appendChild(mthName);
    mainG.appendChild(text);
  }
  // draw 1 column of squares
  function addColumn(x, startAtY, stopAtY, squareDate, mthName) {
    const g = document.createElementNS(svgNS, 'g');
    // draw new month name if arg was passed
    if (mthName) {
      drawMonthText(x, mthName);
    }
    // draw column of squares; startAtY makes it start further down than normal
    // and stopAtY makes it stop further up than normal
    let lowerLimit = (startAtY !== null) ? startAtY : 0;
    let upperLimit = (stopAtY !== null) ? stopAtY : 6;
    for (let i = lowerLimit; i <= upperLimit; i++) {
      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('y', (i * SPACING));
      rect.setAttribute('width', SQUARE_SIZE);
      rect.setAttribute('height', SQUARE_SIZE);
      rect.setAttribute('rx', '2');
      rect.setAttribute('ry', '2');
      // rect.setAttribute('fill', UNMARKED_DAY_COLOR);
      // attach data attr showing square's date as YYYY-MM-DD
      let dateString = getYYYYMMDD(squareDate);
      rect.setAttribute('data-date', dateString);
      // check our passed-in data for date-value pairs
      //if (calData.has(dateString)) {
      //  const level = Math.floor(Math.atan(calData.get(dateString) / 60 + 0.2) * 2.8)
      //  rect.setAttribute('data-level', level);
        // mark the square with a color if it's over 0
        // if (level > 0) {
        //   rect.setAttribute('fill', MARKED_DAY_COLOR);
        // }
      //} else {
        rect.setAttribute('data-level', '0');
      //}
      g.setAttribute('transform', 'translate(' + x + ',0)');
      g.appendChild(rect);
      squareDate.setDate(squareDate.getDate() + 1);
    }
    mainG.appendChild(g);
  }
  // get date of first square, one year ago
  function getStartDate() {
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - 365);
    startDate.setDate(startDate.getDate() + (7 - startDate.getDay()))
    return startDate;
  }
  // draw any text; takes x/y coords, text string and optional class name
  function drawText(x, y, t, className) {
    const text = document.createElementNS(svgNS, 'text');
    if (className) text.setAttribute('class', className);
    text.setAttribute('y', y);
    text.setAttribute('x', x);
    const mthName = document.createTextNode(t);
    text.appendChild(mthName);
    mainG.appendChild(text);
  }
  function drawCalendar() {
    // daysOfWeek represents a column's y values for each weekday
    // e.g. Mondays are always y = 13, Tuesdays are y = 26, etc.
    const daysOfWeek = [];
    for (let i = 0; i < 7; i++) {
      daysOfWeek.push(i * SPACING);
    }
    // draw the labels for M, W, F
    const dayLabels = ['Mon', 'Wed', 'Fri'];
    for (let i in dayLabels) {
      drawText(-10, i * SPACING * 2 + SPACING + 9, dayLabels[i], 'daylabel');
    }
    const mthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // determine which day of the week the first and last squares were
    // so we can draw the first and last columns
    // const startDate = getStartDate();
    // const firstDayWasA = startDate.getDay();
    const today = new Date(); // i.e. now
    const todayIsA = today.getDay();
    // const msInAYear = 864e5;
    // draw a column for each week
    // if we're now in a new month, pass month name as arg
    const squareDate = getStartDate();
    let curMonth = squareDate.getMonth();
    let mthName = squareDate.getDate() > 15 ? null : mthNames[curMonth % 12];
    let numColumns = (todayIsA === 0) ? 53 : 52;
    for (let i = 0; i < numColumns; i++) {
      let s = null;
      let z = null;
      //if (i === 0) s = firstDayWasA;
      //if (i === (numColumns - 1)) z = todayIsA;
      addColumn(i * SPACING + 5, s, z, squareDate, mthName);
      // remember squareDate increments each time addColumn is called
      if (squareDate.getMonth() > curMonth || (squareDate.getMonth() === 0 && curMonth === 11)) {
        curMonth++;
        curMonth = curMonth % 12;
        mthName = mthNames[curMonth];
      } else {
        mthName = null;
      }
    }
  }
  // svg itself
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  tar.appendChild(svg);
  // main group that contains everything within svg
  const mainG = document.createElementNS(svgNS, 'g');
  mainG.setAttribute('transform', 'translate(20,20)');
  svg.appendChild(mainG);
  drawCalendar();
}

/* generate main page */
const calPanel = document.querySelector('.cal-container')
if (calPanel) {
  generateCalendar(calPanel)
  const calmap = new Map()
  let calist = ''
  getFetch('https://app.313159.xyz/calendar/v3/calendars').then(rawJson => {
  rawJson.forEach(item => {
    const dateString = getYYYYMMDD(new Date(item.time))
    const count = calmap.get(dateString) || 0
    calmap.set(dateString, item.dur + count)
    calist += `
    <article>
      <header class="post-header">
        <div class="post-meta-container">
          <time datetime="${dateL.format(new Date(item.time))}">${dateS.format(new Date(item.time)).replace('/', '-')}</time>
        </div>
        <div class="post-title">
          <a class="post-title-link" href="#"><span><mark class="label info">${item.type}</mark> ${item.desc}</span></a>
        </div>
      </header>
    </article>`
  })
  for (let [k, v] of calmap) {
    document.querySelector('rect[data-date="'+k+'"]').setAttribute('data-level', Math.floor(Math.atan(v / 60 + 0.2) * 2.8));
  }
  document.querySelector('.post-content').insertAdjacentHTML('beforeend', calist)
  NexT.motion.integrator.init().add(NexT.motion.middleWares.postList).bootstrap()
  })
}
/* generate sub page */
const calList = document.querySelector('.art-list')
if (calList) {
  getFetch('https://app.313159.xyz/calendar/movies.json').then(rawJson => {
    let li = ''
    rawJson.forEach(info => {
      let title = info['title'];
      if (info['pid']) {
        title = '<a href="/' + info['pid'] + '/">' + info['title'] + '</a>';
      }

      let author = info['author'] ? '<span class="author">' + info['author'] + '</span>' : '';

      let intro = info['intro'] ? info['intro'] : '';

      let star = '';
      if (info['score'] == null) {
        star = '';
      } else {
        let colorStar = '';
        let greyStar = '';
        let int = Math.floor(info['score']); //整数部分
        let fract = 0;
        if (info['score'] % 1 !== 0) {
          fract = 1;
        }
        for (let m = 0; m < int; m++) {
          colorStar += '★';
        }
        if (fract !== 0) {
          colorStar += '☆';
        }
        for (let m = 0; m < (5 - fract - int); m++) {
          greyStar += '☆';
        }
        if (info['score'] !== 5) {
          star = '<span class="star-score">' + colorStar + '<span class="grey-star">' + greyStar + '</span></span>';
        } else {
          star = '<span class="star-score">' + colorStar + '</span>';
        }
      }

      li += '<div class="work">';
      li += '<div class="work-cover" style="background-image:url(' + 'https://pic.313159.xyz/calendar/' + info['cover'] + ')"></div>';
      li += '<div class="work-meta">';
      li += '<div class="work-meta-item title">' + title + '</div>';
      li += '<div class="work-meta-item">' + author + star + '</div>';
      li += '<div class="work-meta-item intro">' + intro + '</div>';
      li += '</div></div>';
    })
    calList.innerHTML = li
  })
}
/* generate link page */
const btnList = document.querySelector('button.collection-header')
if (btnList) {
  btnList.addEventListener('click', (e) => {
  e.target.disabled=true
  if (topbar) topbar.show()
  const fav = {
    'https://xaoxuu.com': 'https://xaoxuu.com/assets/xaoxuu/favicon/favicon-16x16.png',
    'https://www.cayzlh.com': 'https://gcore.jsdelivr.net/gh/cayzlh/psychic-potato@master/logo/favicon.ico'
  }
  const getIcon = (u) => {
    const url = new URL(u).origin
    return fav[url] ?? (url + '/favicon.ico')
  }
  const xhr = new XMLHttpRequest()
  xhr.open('GET', 'https://app.313159.xyz/links')
  xhr.onload = () => {
    if (xhr.readyState === xhr.DONE) {
      try {
        const rawhtml = [...xhr.responseXML.querySelectorAll('item')].map(ele => ({
          title: ele.querySelector('title').textContent.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"),
          desc: ele.querySelector('description').textContent,
          url: ele.querySelector('link').textContent,
          pubdate: new Date(ele.querySelector('pubDate').textContent).valueOf()
        })).sort((a, b) => b.pubdate - a.pubdate).reduce((a, c) => a + `
            <article>
              <header class="post-header">
                <img src="${getIcon(c.url)}" onerror="this.style.display='none'" />
                <div class="post-meta-container">
                  <time datetime="${dateL.format(new Date(c.pubdate))}">${dateS.format(new Date(c.pubdate)).replace('/', '-')}</time>
                </div>
                <div class="post-title">
                  <a class="post-title-link" href="${c.url}"><span>${c.title}</span></a>
                </div>
              </header>
            </article>`, '')
        document.querySelector('.post-content').insertAdjacentHTML('beforeend', rawhtml)
        NexT.motion.integrator.init().add(NexT.motion.middleWares.postList).bootstrap()
      } catch (error) {
        console.error('Error:', error.message);
      }
      document.querySelector('.collection-title').classList.remove('dot-flash')
      if (topbar) topbar.hide()
    }
  }
  xhr.send()
})
}})();