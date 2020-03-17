/**
* file that shows the content to the screen. It is responsible  for the 
* UI of the program. 
*/

let recordDOM = document.getElementById("recordDOM");

let precent = -1;

let lowerBound = 50;
let upperBound = 80;

resetColors();

recordDOM.addEventListener("click", element => {
  let color = element.target.value;
  chrome.tabs.query(
    {
      active: true,
      currentWindow: true
    },
    tabs => {
      chrome.storage.sync.get([String(tabs.url)], function(result) {
        console.log(result);
      });
      chrome.tabs.executeScript({
        file: "/scripts/content-bundle.js"
      });
    }
  );
});

// dropdown listener
// https://materializecss.com/collapsible.html
document.addEventListener("DOMContentLoaded", function() {
  var elems = document.querySelectorAll(".collapsible");
  M.Collapsible.init(elems, {
    accordion: true
  });
});

// Tab listener 
// https://materializecss.com/tabs.html
var tabs = document.querySelectorAll('.tabs')
for (var i = 0; i < tabs.length; i++){
  M.Tabs.init(tabs[i]);
}


// on message received, do something iff request.DIFF exists (i.e. content.js is sending a diff)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!sender || !sender.tab) {
    return sendResponse(null);
  }

  // request contains DIFF to send
    if (request.DIFF !== undefined) {
    sendResponse({
      success: true
    });
    console.log(request.percent);
    updatePopup(request);
    return true;
  }
});

// update popup.html after diff has been received
function updatePopup(request) {
  var output = "";

  //clean collapsible accordion
  document.getElementById("modify-text").innerHTML = "";

  var div = document.getElementById("ring");

  //div.style.visibility = "visible";

  console.log(request);

  let oldInfo = extractNumberAndURL(request.oldUrl);
  let newInfo = extractNumberAndURL(request.newUrl);
  let diff = request.DIFF;
  let stats = request.stats;
  let ratio = [];

  ratio.push(request.structure);
  ratio.push(request.style);
  ratio.push(request.joint);


  console.log(ratio);


  // update site information
  document.getElementById("oldSite").innerHTML = "First Site: " + oldInfo[1] +", date: " + oldInfo[0];
  document.getElementById("newSite").innerHTML = "Second Site: " + newInfo[1] +", date: " + newInfo[0];

  //update chart
  drawChart(stats);
  updateRatios(ratio);

  console.log("precent:" + request.precent);

  // update percentage
  if (request.percent > 0 && request.percent < 1) {

    let calqulatedPrecent = Number( parseFloat( Math.round(request.percent.toFixed(10) * 100) / 100).toFixed(2));

    console.log(calqulatedPrecent);
    analysePercent(calqulatedPrecent);

    document.getElementById("diff").innerHTML = calqulatedPrecent + "%";

  } else if (request.percent > 0 || request.percent === 0) {
    document.getElementById("diff").innerHTML =
      Number(request.percent.toFixed(2)) + "%";
  }

  // update collapsible accordion
  if (request.DIFF.content !== undefined) {
    document.getElementById("modify-text").innerHTML = "No changes yet.";
  } else {
    console.log(request.DIFF);
    document.getElementById('modify-text').innerHTML = jsondiffpatch.formatters.html.format(request.DIFF, request.prev);
    jsondiffpatch.formatters.html.hideUnchanged();
  }
}


//function to reset the colors of the lights
function resetColors() {
  let lights = document.getElementsByClassName("light")

  for(let i = 0; i < lights.length; i++) {
    console.log(lights[i].id)

    if(lights[i].id.localeCompare('redLight') === 0) {
      lights[i].style.backgroundColor = "DarkRed";
    }

    else if(lights[i].id.localeCompare('yellowLight') === 0) {
      lights[i].style.backgroundColor = "DarkGoldenRod";
    }

    else if(lights[i].id.localeCompare('greenLight') === 0) {
      lights[i].style.backgroundColor = "DarkGreen";
    }
    
  }

}

function updateRatios(strRatio) {

  var percentRatios = processRatios(strRatio)

  document.getElementById("structural_ratio").innerHTML = "Structural Ratio: " + percentRatios[0] + "%";
  document.getElementById("style_ratio").innerHTML = "Style Ratio: " + percentRatios[1] + "%";
  document.getElementById("joint_ratio").innerHTML = "Joint Ratio: " + percentRatios[2] + "%";
}

function processRatios(ratio) {

  let percentRatio = [];

  for(e of ratio) {
    percentRatio.push(Math.floor(e * 100))
  }

  return percentRatio;
}



// function to switch which light colors are on
function setColors(lightOn) {
  resetColors();

  console.log("current light: " + lightOn);

  switch(lightOn) {
    case "red":
      document.getElementById("redLight").style.backgroundColor = "Crimson";
      break;
    case "yellow":
      document.getElementById("yellowLight").style.backgroundColor = "Gold";
      break;
    case "green":
      document.getElementById("greenLight").style.backgroundColor = "LightGreen";
      break;
    default:
      console.log("Invalid light color");
  }
}



// function to change color of lights based on the percentage
function analysePercent(percent) {

  console.log("Analyse Percent")

  if(percent < lowerBound) {
    setColors("red");
  } else if(percent > upperBound) {
    setColors("green");
  } else {
    setColors("yellow");
  }
}

// draw the graph
function drawChart(stats) {

  // google.charts.load('current', {packages: ['corechart']});
  // google.charts.setOnLoadCallback(drawChart);


  // // Create the data table.
  // var data = new google.visualization.DataTable();
  // data.addColumn('string', 'Action');
  // data.addColumn('number', 'Data');
  // data.addRows([
  //   ['Add', stats.add],
  //   ['Remove', stats.remove],
  //   ['Replace', stats.replace],
  //   ['Move', stats.move]
  // ]);

  // // Set chart options
  // var options = {'title':'',
  //                'width':400,
  //                'height':300};

  // // Instantiate and draw our chart, passing in some options.
  // var chart = new google.visualization.PieChart(document.getElementById('chart_div'));
  // chart.draw(data, options);

  var ctx = document.getElementById("chart").getContext('2d');
  var myChart = new Chart(ctx, {
      type: 'bar',
      data: {
          labels: [ 'Add', 'Remove', 'Replace', 'Move' ],
              datasets: [{
                barPercentage: 0.5,
                barThickness: 6,
                maxBarThickness: 8,
                minBarLength: 2,

                backgroundColor: [
                    "#59be5b",
                    "#d56328",
                    "#ff1b2d",
                    "#0078d7"
                ],
              data: [ stats.add, stats.remove, stats.replace, stats.move ]
          }]
      }
  });

}

// return name or nodename of a diff
function getName(diffObj) {
  if (diffObj.name) {
    return diffObj.name;
  } else if (diffObj.element) {
    let elName = diffObj.element.nodeName || diffObj.element.tagName;
    if (diffObj.element.nodeName) {
      return elName;
    } else {
      return null;
    }
  } else {
    if (!diffObj.oldValue || !diffObj.newValue) {
      return null;
    }
    return "text";
  }
}

// return attributes of a diff if applicable
// if no attributes, return value
function getAttributes(diffObj) {
  if (diffObj.element) {
    if (diffObj.element.childNodes) {
      return JSON.stringify(diffObj.element.childNodes);
    } else {
      return "None";
    }
  } else {
      let val = JSON.stringify(diffObj.value || diffObj.newValue || {}).replace(/[\s\t\n]/, '');
      if (!val) { return 'Whitespace'; }
      return val;
  }
}


function extractNumberAndURL(url) {
  let info = [];
  let urlArr = url.split("/");

  info[0] = extractDate(urlArr[4]);
  info[1] = urlArr[7];


  console.log(info);

  return info;
}


function extractDate(number) {
  let separateNum = number.split("");

  let date = "";

  date += separateNum.slice(0, 4).join("");
  date +=  "/"
  date += separateNum.slice(4, 6).join("");
  date +=  "/"
  date += separateNum.slice(6, 8).join("");

  return date;
}