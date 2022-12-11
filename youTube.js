const puppeteer = require('puppeteer');
let loginLink = 'https://www.youtube.com/playlist?list=PLRBp0Fe2GpglsIK7NTDDH9x9qqwZ5yZGu'
let cTab;
const pdf = require('pdfkit');
const fs = require('fs');

(async function(){
   
    try {
        let browserOpen =  puppeteer.launch({
            headless:false,
         defaultViewport:null,
         args:['--start-maximized'],

        })   
        
        let browserIntance = await browserOpen;
        let allTabs = await browserIntance.pages();
         cTab = allTabs[0];
         await cTab.goto(loginLink);
         await cTab.waitForSelector(".style-scope.yt-dynamic-sizing-formatted-string.yt-sans-28");
         let name =  await cTab.evaluate(function(select){return document.querySelector(select).innerText} ,".style-scope.yt-dynamic-sizing-formatted-string.yt-sans-28");
         console.log(name);
         let getallData = await cTab.evaluate(getData,".byline-item.style-scope.ytd-playlist-byline-renderer")
          
         let totalNoVideos = getallData.noOfVideos.split(' ')[0];
         let currentPageLength = await getCVideosLength();
        //  console.log(currentPageLength);

        while(totalNoVideos - currentPageLength >=10) {
            await scrollDown();
            currentPageLength = await getCVideosLength();
        }
   
           let finalList = await getStats();
        //    console.log(finalList);
        let pdfDoc = new pdf;
        pdfDoc.pipe(fs.writeFileSync('play.pdf'));
        pdfDoc.text(JSON.stringify(finalList))
        pdfDoc.end();
         
        

    } catch (error) {
       console.log(error); 
    }
})();


async function getCVideosLength() {
    let lengthOfVideos = await cTab.evaluate(getLength,'#content>#container');
    return lengthOfVideos; 
}



async function  scrollDown() {
       await cTab.evaluate(goToDown);
       function goToDown() {
        window.scrollBy(0,window.innerHeight);
       }
}

function getData(selector) {
    let allData =document.querySelectorAll(selector);
    let noOfVideos = allData[0].innerText;
    let updatedOn = allData[1].innerText;


    return {
        noOfVideos,
        updatedOn
    }
}

function getLength(select) {
    let  lengthOfContainer = document.querySelectorAll(select);
    return lengthOfContainer.length;

}

async function getStats() {
    let list = cTab.evaluate(getNameAndDuration , "#video-title" ,"#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer");
    return list;
}



function getNameAndDuration(videoName , DurationOfVideo) {
    
    let getVideoNameDetail = document.querySelectorAll(videoName);
    let durationDetail = document.querySelectorAll(DurationOfVideo);

    let currentList = [];


    for(let i = 0 ; i < getVideoNameDetail.length ;i++) {
        let videoTitle = getVideoNameDetail[i].innerText;
        let durationElem = durationDetail[i].innerText;
        currentList.push({videoTitle , durationElem});
        // console.log(videoTitle);
    }

    return currentList;
}