/**
* file that shows the content to the screen. It is responsible  for the 
* UI of the program. 
*/

let recordDOM = document.getElementById("recordDOM");

let precent = -1;

let lowerBound = 50;
let upperBound = 150;

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

  div.style.visibility = "visible";

  let diff = request.DIFF;

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


// function to switch which light colors are on
function setColors(lightOn) {
  resetColors();

  switch(lightOn) {
    case "red":
      document.getElementById("redLight").style.backgroundColor = "red";
      break;
    case "yellow":
      document.getElementById("yellowLight").style.backgroundColor = "yellow";
      break;
    case "green":
      document.getElementById("greenLight").style.backgroundColor = "green";
      break;
    default:
      console.log("Invalid light color");
  }
}

// function to change color of lights based on the percentage
function analysePercent(percent) {

  console.log("Analyse Percent")

  if(percent < lowerBound) {
    setColors("green");
  } else if(percent > upperBound) {
    setColors("red");
  } else {
    setColors("yellow");
  }
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
