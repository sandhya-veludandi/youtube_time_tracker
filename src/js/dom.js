import { formatTime, uplift } from './helpers/formatting';
import {
  todayDate,
  yesterdayDate,
  thisWeek,
  lastWeek,
  thisMonth,
  lastMonth,
  thisYear,
  lastYear
} from './helpers/date';
import { readData } from './tracker';
import { getCookie, setCookie } from './helpers/cookie';
import { log } from './helpers/log';

let TIMER_DATA;

const timerBlock = function() {
  const logo = document.getElementById("logo");
  let timer = document.getElementById("youtube-time-tracker");

  if(!timer) {
    timer = document.createElement("div");

    timer.innerHTML = `
      <div class="youtube-time-tracker__body">
        <div class="youtube-time-tracker__stopwatch-icon">
        </div>

        <div class="youtube-time-tracker__time">
        </div>

        <div id="notif" class="youtube-time-tracker__notif">
          <div class="youtube-time-tracker__notif-body">
            You have reached or exceeded your daily time limit on YouTube.
          </div>
        </div>

        <div class="youtube-time-tracker__popup">
          <div class="youtube-time-tracker__popup-body">
            <div class="youtube-time-tracker__name">
              Youtube Time Tracker
            </div>

            <ul class="youtube-time-tracker__stats">
            </ul>

            <div style="color: black;" class="youtube-time-tracker_daily-limit">
              <br>
              <label for="limit">Select a time limit:</label>
              <input type="time" id="limit" name="limit" value="00:30">
              <input id="limit-button" type="submit">
              <p id="demo1"></p>
              <p id="demo2"></p>
            </div>

            <div class="youtube-time-tracker__links">
              <a class="youtube-time-tracker__link secondary-link"
                href="https://github.com/makaroni4/youtube_time_tracker"
                target="_blank">
                Source code
              </a>

              <a class="youtube-time-tracker__link secondary-link"
                href="http://bit.ly/YTT-feedback"
                target="_blank">
                Give feedback
              </a>
            </div>
          </div>

          <div class="youtube-time-tracker__rating">
            <div class="youtube-time-tracker__rating-description">
              If you like the extension – please, spread the word & rate it in Chrome Web Store:
            </div>

            <div class="youtube-time-tracker__rating-cta">
              <a href="http://bit.ly/rate-YTT"
                 class="youtube-time-tracker__rating-button js-ytt-rating"
                 target="_blank">
                RATE IT
              </a>

              <a href="#"
                 class="secondary-link youtube-time-tracker__rating-later js-hide-ytt-rating">
                Later
              </a>
            </div>
          </div>
        </div>
      </div>
    `.trim();

    timer.id = "youtube-time-tracker";
    timer.className = "youtube-time-tracker";

    logo.parentNode.insertBefore(timer, logo.nextSibling);

    const dailyTimeLimitSubmitButton = document.querySelector("#limit-button")
    const ratingBlock = document.querySelector(".youtube-time-tracker__rating");
    const ratingLink = ratingBlock.querySelector(".js-ytt-rating");
    const closeLink = ratingBlock.querySelector(".js-hide-ytt-rating");
    const ratingCookie = "ytt-rating";
    const disableRatingBlock = () => {
      ratingBlock.remove();

      setCookie(ratingCookie, true, 180);
    }

    if(!getCookie(ratingCookie)) {
      ratingBlock.classList.add("youtube-time-tracker__rating--active");
    }

    ratingBlock.addEventListener("click", function(e) {
      disableRatingBlock();
    });

    closeLink.addEventListener("click", function(e) {
      e.preventDefault();

      disableRatingBlock();
    });

    dailyTimeLimitSubmitButton.addEventListener("click", function(e) {
      console.log("daily time limit button selected")
      checkIfTimeLimitExceeded();
    })
  }

  return timer;
}

const checkIfTimeLimitExceeded = () => {
  console.log("hello check if working")
  // get the limit from the input field
  let daily_time_limit = document.getElementById("limit").value;
  let daily_time_limit_min = daily_time_limit.substring(3); // extract min
  console.log(daily_time_limit_min)
  console.log(daily_time_limit_min.charAt(0))
  console.log(daily_time_limit_min.charAt(0) === '0')
  
  if (daily_time_limit_min.charAt(0) === '0') {
    console.log("first minute is 0");
    daily_time_limit_min = daily_time_limit_min.charAt(1);
  }
  let daily_time_limit_hours = daily_time_limit.substring(0, 2); // extract hours

  // get the daily time spent on youtube
  let daily_time = formatTime(TIMER_DATA[todayDate()]);
  let daily_time_min = daily_time.substring(0, daily_time.indexOf("min")) // extract min
  // extract hours
  document.getElementById("demo1").innerHTML = daily_time_limit_min;
  document.getElementById("demo2").innerHTML = daily_time_min;

  daily_time_limit_min = parseInt(daily_time_limit_min, 10)
  daily_time_min = parseInt(daily_time_min, 10)

  //check if time limit exceeded
  var displayStatus = document.getElementById("notif");
  console.log("daily_time_min: ", daily_time_min)
  console.log("daily_time_limit_min: ", daily_time_limit_min)
  console.log("daily_time_min >= daily_time_limit_min: ", daily_time_min >= daily_time_limit_min)
  if (daily_time_min >= daily_time_limit_min) {
    //create popup
    console.log("daily time limit exceeded")
    displayStatus.style.display = 'block'
  } else {
    console.log("you can keep watching")
    displayStatus.style.display = 'none'
  }
}

const upliftCssClass = function(currentTime, prevTime) {
  if(currentTime === 0 || currentTime === undefined || prevTime === undefined || prevTime < 5) {
    return "";
  }

  let cssClass = "ytt-stat__uplift--active";

  if(currentTime > prevTime) {
    cssClass += " ytt-stat__uplift--red";
  } else {
    cssClass += " ytt-stat__uplift--green";
  }

  return cssClass;
}

const renderStat = function(timerData, name, key, prevKey) {
  let output = "";

  const duration = formatTime(timerData[key]);

  output += `
    <li>
      <div class="ytt-stat">
        <div class="ytt-stat__time">
          ${name}: ${duration}
        </div>

        <div class="ytt-stat__uplift ${upliftCssClass(timerData[key], timerData[prevKey])}">
          ${uplift(timerData[key], timerData[prevKey]) || ""}
        </div>
      </div>
    </li>
  `;

  return output;
}

const statsContent = function(timerData) {
  const today = todayDate();
  const week = thisWeek();
  const month = thisMonth();
  const year = thisYear();

  const yesterday = yesterdayDate();
  const prevWeek = lastWeek();
  const prevMonth = lastMonth();
  const prevYear = lastYear();

  let stats = "";

  stats += renderStat(timerData, "Today", today, yesterday);
  stats += renderStat(timerData, "This week", week, prevWeek);
  stats += renderStat(timerData, "This month", month, prevMonth);
  stats += renderStat(timerData, "This year", year, prevYear);

  if(timerData["installed_at"]) {
    const installedAt = new Date(timerData["installed_at"]);

    stats += renderStat(timerData, `Total since ${installedAt.getFullYear()}`, "time_watched");
  }

  return stats;
}

const getTimerData = () => {
  return TIMER_DATA;
}

const setTimerData = (timerData) => {
  TIMER_DATA = timerData;
}

export const renderTimer = function(timerData) {
  log('--> renderTimer');
  console.log("setting timer data")
  setTimerData(timerData);
  let logo = document.getElementById("logo");

  if(logo) {
    const timer = timerBlock();
    const timeBlock = timer.querySelector(".youtube-time-tracker__time");
    const statsBlock = timer.querySelector(".youtube-time-tracker__stats");

    const today = todayDate();
    const yesterday = yesterdayDate();

    if(timerData) {
      timeBlock.innerHTML = formatTime(timerData[today]);
      statsBlock.innerHTML = statsContent(timerData);
      checkIfTimeLimitExceeded();
    } else {
      readData(function(timerData) {
        timeBlock.innerHTML = formatTime(timerData[today]);
        statsBlock.innerHTML = statsContent(timerData);
        checkIfTimeLimitExceeded();
      });
    }
  }
}
