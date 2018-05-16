import moment from "moment";
import { themes } from "./themes";

function getTheme(opts = {}) {
  const { themeName } = opts;
  if (themeName in themes) {
    return themes[themeName];
  }
  return themes.standard;
}

function getDateInfo(data, date) {
  return data.contributions.find(contrib => contrib.date === date);
}

function getContributionCount(graphEntries) {
  return graphEntries.reduce((rowTotal, row) => {
    return (
      rowTotal +
      row.reduce((colTotal, col) => {
        return colTotal + (col.info ? col.info.count : 0);
      }, 0)
    );
  }, 0);
}

const DATE_FORMAT = "YYYY-MM-DD";
const boxWidth = 10;
const boxMargin = 2;
const textHeight = 15;
const defaultFontFace = "IBM Plex Mono";
const headerHeight = 60;
const canvasMargin = 20;
const yearHeight = textHeight + (boxWidth + boxMargin) * 8 + canvasMargin;
const scaleFactor = window.devicePixelRatio || 1;

function drawYear(ctx, opts = {}) {
  const {
    year,
    offsetX = 0,
    offsetY = 0,
    data,
    fontFace = defaultFontFace
  } = opts;
  const thisYear = moment().format("YYYY");
  const today = year.year === thisYear ? moment() : moment(year.range.end);
  const start = moment(`${year.year}-01-01`);
  const firstDate = start.clone();
  const theme = getTheme(opts);

  if (firstDate.day() !== 6) {
    firstDate.day(-(firstDate.day() + 1 % 7));
  }

  const nextDate = firstDate.clone();
  const firstRowDates = [];
  const graphEntries = [];

  while (nextDate <= today && nextDate.day(7) <= today) {
    const date = nextDate.format(DATE_FORMAT);
    firstRowDates.push({
      date,
      info: getDateInfo(data, date)
    });
  }

  graphEntries.push(firstRowDates);

  for (let i = 1; i < 7; i += 1) {
    graphEntries.push(
      firstRowDates.map(dateObj => {
        const date = moment(dateObj.date)
          .day(i)
          .format(DATE_FORMAT);
        return {
          date,
          info: getDateInfo(data, date)
        };
      })
    );
  }

  const count = new Intl.NumberFormat().format(
    getContributionCount(graphEntries)
  );

  ctx.textBaseline = "hanging";
  ctx.fillStyle = theme.text;
  ctx.font = `10px '${fontFace}'`;
  ctx.fillText(
    `${year.year}: ${count} Contribution${year.total === 1 ? "" : "s"}${
      thisYear === year.year ? " (so far)" : ""
    }`,
    offsetX,
    offsetY - 17
  );

  for (let y = 0; y < graphEntries.length; y += 1) {
    for (let x = 0; x < graphEntries[y].length; x += 1) {
      const day = graphEntries[y][x];
      if (moment(day.date) > today || !day.info) {
        continue;
      }
      const color = theme[`grade${day.info.intensity}`];
      ctx.fillStyle = color;
      ctx.fillRect(
        offsetX + (boxWidth + boxMargin) * x,
        offsetY + textHeight + (boxWidth + boxMargin) * y,
        10,
        10
      );
    }
  }

  // Draw Month Label
  let lastCountedMonth = 0;
  for (let y = 0; y < graphEntries[0].length; y += 1) {
    const date = moment(graphEntries[0][y].date);
    const month = date.month() + 1;
    const firstMonthIsDec = month == 12 && y == 0;
    const monthChanged = month !== lastCountedMonth;
    if (monthChanged && !firstMonthIsDec) {
      ctx.fillStyle = theme.meta;
      ctx.fillText(date.format('MMM'), offsetX + (boxWidth + boxMargin) * y, offsetY);
      lastCountedMonth = month;
    }
  }
}

function drawMetaData(ctx, opts = {}) {
  const {
    username,
    width,
    height,
    footerText,
    fontFace = defaultFontFace
  } = opts;
  const theme = getTheme(opts);
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, width, height);

  if (footerText) {
    ctx.fillStyle = theme.meta;
    ctx.textBaseline = "bottom";
    ctx.font = `10px '${fontFace}'`;
    ctx.fillText(footerText, canvasMargin, height - 5);
  }

  ctx.fillStyle = theme.text;
  ctx.textBaseline = "hanging";
  ctx.font = `20px '${fontFace}'`;
  ctx.fillText(`@${username} on GitHub`, canvasMargin, canvasMargin);

  ctx.beginPath();
  ctx.moveTo(canvasMargin, 55);
  ctx.lineTo(width - canvasMargin, 55);
  ctx.strokeStyle = theme.grade0;
  ctx.stroke();
}

export function drawContributions(canvas, opts) {
  const { data, username } = opts;
  const height =
    data.years.length * yearHeight + canvasMargin + headerHeight + 10;
  const width = 53 * (boxWidth + boxMargin) + canvasMargin * 2;

  canvas.width = width * scaleFactor;
  canvas.height = height * scaleFactor;

  const ctx = canvas.getContext("2d");
  ctx.scale(scaleFactor, scaleFactor);
  ctx.textBaseline = "hanging";

  drawMetaData(ctx, {
    ...opts,
    width,
    height
  });

  data.years.forEach((year, i) => {
    const offsetY = yearHeight * i + canvasMargin + headerHeight;
    const offsetX = canvasMargin;
    drawYear(ctx, {
      ...opts,
      year,
      offsetX,
      offsetY,
      data
    });
  });
}



const lineChartHeight = 500;

export function drawLineChart(canvas, opts) {
  const { data, username } = opts;
  const xAxisHeight = 50;
  const height =
    lineChartHeight + canvasMargin + headerHeight + xAxisHeight + 10;
  const width = 53 * (boxWidth + boxMargin) + canvasMargin * 2;

  canvas.width = width * scaleFactor;
  canvas.height = height * scaleFactor;

  const ctx = canvas.getContext("2d");
  ctx.scale(scaleFactor, scaleFactor);
  ctx.textBaseline = "hanging";

  drawMetaData(ctx, {
    ...opts,
    width,
    height
  });
  var total = 0;
  var largestYear = 0;
  var smallestYear = 0;
  data.years.forEach((year) => {
    total += year.total;
    largestYear = year.total>largestYear ? year.total:largestYear;
    smallestYear = year.total<smallestYear ? year.total:smallestYear;
  });
  const tickLength = 30;
  const yAxisWidth = 50;
  const xAxis = yAxisWidth + width - 100; //length of line of x axis
  var pointSpacingY=largestYear/(lineChartHeight-xAxisHeight);
  var xAxisSpacing = xAxis/(data.years.length);
  var lastValueY;
  var lastValueX;
  var graphHeight = lineChartHeight-xAxisHeight;
  var yAxisTicksSpacing = graphHeight/4; //five ticks on the y axis
  const theme = getTheme(opts);
  const {
    footerText,
    fontFace = defaultFontFace
  } = opts;

  var points = [];
  var contributions = [];

  ctx.beginPath();
  ctx.moveTo(yAxisWidth + canvasMargin, 70);
  ctx.lineTo(yAxisWidth + canvasMargin, lineChartHeight + 85 - xAxisHeight);
  ctx.strokeStyle = theme.grade4;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(yAxisWidth + 5, lineChartHeight + 70 - xAxisHeight);
  ctx.lineTo(yAxisWidth + width - 100, lineChartHeight + 70 - xAxisHeight);
  ctx.strokeStyle = theme.grade4;
  ctx.stroke();
  ctx.save();

  ctx.fillStyle = theme.text;
  ctx.textBaseline = "hanging";
  ctx.font = `10px '${fontFace}'`;
  ctx.translate(canvasMargin-15, lineChartHeight/2 + 70);
  ctx.rotate(Math.PI/-2)
  ctx.fillText("contributions", 0, 0);
  ctx.restore();

  data.years.reverse();
  data.years.forEach((year, i) => {
    var xAxisTickSpacing = yAxisWidth+canvasMargin+(xAxisSpacing*i)
    var point = new Point(xAxisTickSpacing, lineChartHeight + 65 - xAxisHeight-year.total/pointSpacingY, year.total)
    points.push(point);

    if (!contributions.includes(year.total)) {
      if (point.total != smallestYear && smallestYear != largestYear) {
        ctx.beginPath();
        ctx.moveTo(yAxisWidth + canvasMargin - tickLength/2, lineChartHeight + 70 - xAxisHeight-year.total/pointSpacingY);
        ctx.lineTo(yAxisWidth + canvasMargin + tickLength/2 , lineChartHeight + 70 - xAxisHeight-year.total/pointSpacingY);
        ctx.strokeStyle = theme.grade3;
        ctx.stroke();
      }
      ctx.fillStyle = theme.text;
      ctx.textBaseline = "hanging";
      ctx.font = `10px '${fontFace}'`;
      ctx.fillText(year.total, canvasMargin, lineChartHeight + 65 - xAxisHeight-year.total/pointSpacingY,yAxisWidth);

      contributions.push(year.total);
    }

    if(point.x != yAxisWidth+canvasMargin) {
      ctx.beginPath();
      ctx.moveTo(xAxisTickSpacing, lineChartHeight + 70 - xAxisHeight - tickLength/2);
      ctx.lineTo(xAxisTickSpacing, lineChartHeight + 70 - xAxisHeight + tickLength/2);
      ctx.strokeStyle = theme.grade3;
      ctx.stroke();
    }

    ctx.fillStyle = theme.text;
    ctx.textBaseline = "hanging";
    ctx.font = `10px '${fontFace}'`;
    ctx.fillText(year.year, xAxisTickSpacing-13, lineChartHeight + 70 - xAxisHeight + tickLength/2 + 50);

    ctx.fillStyle = theme.grade1;
    ctx.fillRect(xAxisTickSpacing-5,lineChartHeight + 65 - xAxisHeight-year.total/pointSpacingY,10,10);
    lastValueX=xAxisTickSpacing-5;
    lastValueY=lineChartHeight + 65 - xAxisHeight-year.total/pointSpacingY;
  });
  points.forEach((point, i) => {
    if(i != 0) {
      ctx.lineTo(point.x,point.y+5);
      ctx.strokeStyle = theme.grade1;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(point.x,point.y+5);
    }
  });


}

function Point(x,y,total) {
  this.x = x;
  this.y = y;
  this.total = total;
}
