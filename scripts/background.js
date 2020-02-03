/**
 * @author Jess Cannarozzo
 * the extension's event handler; it contains listeners for browser events that are important to the extension. 
 * It lies dormant until an event is fired then performs the instructed logic.
 * An effective background script is only loaded when it is needed and unloaded when it goes idle.
 */

var oldValue = {};
var newValue = {};
var oldUrl = "";
var newUrl = "";


//receive DOM from content.js
//save old value
//store as: {url: DOM String}
//response: old and new DOM
chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        if (!sender || !sender.tab) {
            return sendResponse(null);
        }

        if (request.DOM != undefined) {
            var url = sender.tab.title;

            newValue = {};
            newValue[url] = {};
            newValue[url].DOM = request.DOM + '';
    
            chrome.storage.local.get(url, result => {
                oldValue = result;
                chrome.storage.local.set(newValue); // this accepts a callback
                updateURL(sender.tab.url);
                console.log("old: " + JSON.stringify(oldValue, null, 2));
                console.log("new: " + JSON.stringify(newValue, null, 2));

                console.log("new url: " + newUrl);
                console.log("old url: " + oldUrl);
                sendResponse({
                    oldValue: Object.getOwnPropertyNames(oldValue).length === 0 ? "" : oldValue[url].DOM,
                    newValue: newValue[url].DOM,
                    oldURL: oldUrl,
                    newURL: newUrl
                });
            })
            return true;
        }        
    });


function updateURL(url) {
    if(oldUrl.localeCompare("") === 0) {
        oldUrl = url;
        newUrl = url;
    } else  {
        oldUrl = newUrl;
        newUrl = url;
    }
}