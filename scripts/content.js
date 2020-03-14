import { html2json } from 'html2json';
import * as jsondiffpatch from 'jsondiffpatch';
import * as sequencematcher from 'sequencematcher';
var difflib = require('difflib');
var sm = require('sequencematcher');
var diff = {};

try {
    chrome.runtime.sendMessage({
        DOM: createHTMLString()
    },
    function (response) {
        diff = {};
        var diffPercent = 0;
        var ratio = 0.0;
        // console.log("Response: ", response);
        diff = makeDIFF(response, function(diff) {
            //send message to popup.js
            diffPercent = calculateDiffPercent(response, function(diffPercent) {

                ratio = structuralSim(response, function(ratio) {
                    console.log(response);
                    try {
                        chrome.runtime.sendMessage({
                            DIFF: diff,
                            prev: html2json(response.oldValue),
                            percent: diffPercent,
                            structuralRatio: ratio,
                            oldUrl: response.oldURL,
                            newUrl: response.newURL,
                            stats: getStats(diff),
                        },
                        function (response) {
                            // console.log("Response: ", response);
                        });
                    } catch(e) {
                        console.log("Something went wrong while trying to send the DOM diff: " + e);
                    }
                });


            });
        });
    });
} catch(e) {
    console.log("Something went wrong: " + e);
}

// calculate percentage of changes between old and new DOMs
// formula borrowed from https://www.calculator.net/percent-calculator.html
function calculateDiffPercent(response, cb) {
    var oldValue = JSON.stringify(response.oldValue);
    var newValue = JSON.stringify(response.newValue);

    //structuralSim(response.oldValue, response.newValue)
    
    var diffPercent = (Math.abs(oldValue.length - newValue.length) / ((oldValue.length + newValue.length)/2)) * 100;
    //console.log(diffPercent);
    cb(diffPercent);
}

// uses DiffDOM to make a diff of two HTML strings
function makeDIFF(response, cb) {
    if (response.oldValue != undefined && response.newValue != undefined) { 
        let diff = {};
        console.log("Response: ", response);

        // replace whitespace and newline before diff
        console.log("1" + response.oldValue);
        console.log("2" + response.newValue);
        let oldValue = html2json(response.oldValue); 
        let newValue = html2json(response.newValue); 

        console.log(oldValue);
        console.log(newValue);

        diff = jsondiffpatch.diff(oldValue, newValue);

        // let delta = jsondiffpatch.formatters.jsonpatch.format(diff);
        // console.log("the delta");
        // getStats(delta);

        if (diff === undefined) {
            diff = {content: false};
        }
    
        cb(diff);
    }
}

function createHTMLString() {
    // console.log(document.getElementsByTagName('center'));
    // if (!document.getElementsByTagName('center')) { return ''; }

    // let centerHTML = document.getElementsByTagName('center');
    // let outputString = "";

    // var i;
    // for (i = 0; i < centerHTML.length; i++) {
    //     outputString = outputString + centerHTML[i].innerHTML;
    // }
    // console.log(outputString);
    // return outputString
    let outputString = document.body.outerHTML;
    let splitted = [];

    console.log("Hello, this is the content.js script");
    //console.log(outputString);
    splitted = outputString.split("<div id=\"wm-ipp-base\" lang=\"en\" style=\"display: block; direction: ltr;\"> </div>")
    // console.log(outputString);

    outputString = splitted[0].concat(splitted[1]);
    // console.log(outputString);
    return outputString;
}


function getStats(diff) {
    let stats = {add: 0, remove: 0, replace: 0, move: 0}
    let delta = jsondiffpatch.formatters.jsonpatch.format(diff);

    for(var key in delta) {
        if(delta.hasOwnProperty(key)) {

            switch(delta[key].op) {
                case "add":
                    stats.add += 1;
                    break;
                case "remove":
                    stats.remove += 1;
                    break;
                case "replace":
                    stats.replace += 1;
                    break;
                case "move":
                    stats.move += 1;
                    break;
                default:
                    console.log("invalid operation");
                    break;
            }
        }
    }

    //console.log(stats);
    return stats;
}

// function to get the element sequence from the DOM tree
function getDocSequence(domJson) {
    let sequence = [];
    //let 
    recursion(domJson, sequence);

    return sequence;
}

//support function for getDocSequence
function recursion(data, squ) {

    if(data.child === undefined) {
    return;
  }
  
  console.log(data.node)
  if(data.node === 'element') {
    squ.push(data.tag);
  }
  
  for(let ch in data.child) {
    //console.log(data.child[ch]);
    recursion(data.child[ch], squ);
  }
  //console.log(squ);
  return;
}

// get the css classes used from the DOM tree
function getClasses(domJson) {
    let classes = [];

    classRecursion(domJson, classes);

    return classes;
}

function classRecursion(data, arr) {
    if(data.child === undefined) {
        return;
    }

    if(data.attr.class !== undefined) {
        arr.push(data.attr.class);
    }

    for(let ch in data.child) {
        classRecursion(data.child[ch], arr);
    }

    return;
}


function structuralSim(response, cb) {
    console.log("Structural Sim");

    let document_1 = response.oldValue;
    let document_2 = response.newValue;
    let doc_1 = html2json(document_1);
    let doc_2 = html2json(document_2);

    console.log(doc_1);

    let seq_1 = getDocSequence(doc_1);
    let seq_2 = getDocSequence(doc_2);

    console.log(seq_1);
    console.log(seq_2);

    let diff = new difflib.SequenceMatcher(null, seq_1, seq_2);

    console.log("ratio: " + diff.ratio())

    cb(diff.ratio());
}

/*
* param 1: html string
* param 2: html string
* return int 
*/
function styleSim(document_1, document_2){
    let classDoc_1 = getClasses(document_1);
    let classDoc_2 = getClasses(document_2);

    return jaccard_similarity(classDoc_1, classDoc_2); 
}

function jaccard_similarity(classArr_1, classArr_2) {
    let set_1 = new Set(classArr_1);
    let set_2 = new Set(classArr_2);

    let setInter = findIntersection(set_1, set_2);
    let numerator = setInter.size;

    if(set_1.size === 0 && set_2.size === 0) {
        return 1.0;
    }


    let demoninstor = set_1.size + set_2.size - numerator;
    if(demoninstor === 0) {
        demoninstor = 0.000001;
    } 

    return numerator / demoninstor;
}

/*
* Joint similarity function combining the structural and style similarity into 
* one calqulation. 
*/
function jointSim(structural_similarity, style_similarity, k = 0.5) {
    return k * structural_similarity + (1 - k) * style_similarity;
}

function getDocument() {
    let doc = document.getElementsByTagName("*");


    return doc;
}

function findIntersection(set1, set2) {
    let answer = new Set();

    for(let e in set1) {
        if(set2.has(e)) {
            answer.add(e);
        }
    }

    return answer;
}