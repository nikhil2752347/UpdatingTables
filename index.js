/**
 * This javascript file will constitute the entry point of your solution.
 *
 * Edit it as you need.  It currently contains things that you might find helpful to get started.
 */
// This is not really required, but means that changes to index.html will cause a reload.
require('./site/index.html')
// Apply the styles in style.css to the page.
require('./site/style.css')

// if you want to use es6, you can do something like
//     require('./es6/myEs6code')
// here to load the myEs6code.js file, and it will be automatically transpiled.

// Change this to get detailed logging from the stomp library
global.DEBUG = false

const url = "ws://localhost:8011/stomp"
const client = Stomp.client(url);
let receivedData = [];
let processingData = [];
let results = [];
var timerFlag = false;

client.debug = function(msg) {
    if (global.DEBUG) {
        console.info(msg)
    }
}

function connectCallback() {
    //setInterval(setsubscribeTo,3000);
    // Uses a 100ms rather than 1000ms counter, stopping after two seconds
    var msg = client.subscribe('/fx/prices', subcriber, {
        priority: 9
    })
};

var subcriber = function(msg) {
    receivedData.push(JSON.parse(msg.body))
    if (!timerFlag) {
        timerFlag = true;
        let handle = setTimeout(function() {
      // Array with unique key for currency pair      
            let uniqueArray = getUniqueNameList();
      // Sorting logic on the basis bestbid in last 30 seconds and lastChangeBid    
            results = getFilteredList(uniqueArray);
            if (results.length > 0) {      
                getTableData(results)
            }
            timerFlag = false;
        }, 30000);
    }
};


function getUniqueNameList(){  
    let unique = {};
    let distinct = [];
    receivedData.forEach(function(x) {
        if (!unique[x.name]) {
            distinct.push(x.name);
            unique[x.name] = true;
        }
    });
    if (distinct.length > 0) {
        return distinct;
    }
};

function getFilteredList(distinct) {
    let resultList = [];
    for (let i = 0; i < distinct.length; i++) {
        let midPriceList = [];
    // generate array for currency pair    
        let filtered = receivedData.filter(a => a.name == distinct[i]);
        for (let j = 0; j < filtered.length; j++) {
     // midpriceList for sparkline graph       
            midPriceList.push((filtered[j].bestBid + filtered[j].bestAsk) / 2);
        }
        let sortedData = sortByKey(filtered, "bestBid");
      // maximum bestBid selection for a specific currency pair   
        sortedData[sortedData.length - 1].midPrice = midPriceList;
        resultList.push(sortedData[sortedData.length - 1]);
    }
    if (resultList.length > 0) {
        resultList = sortByKey(resultList, "lastChangeBid");
        return resultList;
    } else {
        return null;
    }
};

function sortByKey(array, key) {
    return array.sort(function(a, b) {
        var x = a[key];
        var y = b[key];
        if (typeof x == "string") {
            x = ("" + x).toLowerCase();
        }
        if (typeof y == "string") {
            y = ("" + y).toLowerCase();
        }
        return (x - y);
    });
};

function getTableData(filtered) {
    processingData = []
    processingData = filtered;
    if (processingData.length)
        GenerateTable(processingData);
    results = [];
    receivedData = [];
}

function GenerateTable(tempArrayData) {
    // CREATE DYNAMIC TABLE.
    var col = [];
    for (var i = 0; i < tempArrayData.length; i++) {
        for (var key in tempArrayData[i]) {
            if (col.indexOf(key) === -1) {
                col.push(key);
            }
        }
    }

    var table = document.createElement("table");

    // CREATE HTML TABLE HEADER ROW USING THE EXTRACTED HEADERS ABOVE.

    var tr = table.insertRow(-1); // TABLE ROW.

    for (var i = 0; i < col.length; i++) {
        var th = document.createElement("th"); // TABLE HEADER.
        th.innerHTML = col[i];
        tr.appendChild(th);
    }

    // ADD JSON DATA TO THE TABLE AS ROWS.
    for (var i = 0; i < tempArrayData.length; i++) {

        tr = table.insertRow(-1);

        for (var j = 0; j < col.length; j++) {
            var tabCell = tr.insertCell(-1);
            if (j == col.length - 1) {
                Sparkline.draw(tabCell, tempArrayData[i][col[j]])
            } else {
                tabCell.innerHTML = tempArrayData[i][col[j]];
            }
        }
    }

    // FINALLY ADD THE NEWLY CREATED TABLE WITH JSON DATA TO A CONTAINER.
    var divContainer = document.getElementById("dvTable");
    divContainer.innerHTML = "";
    divContainer.appendChild(table);

};
client.connect({}, connectCallback, function(error) {
    alert(error.headers.message)
})

