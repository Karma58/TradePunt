const p2pengine=require('./p2pengine.js')
// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron')
var path = require('path')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

//------------------------------------------------------
//------------------------------------------------------
  const {ipcMain} = require('electron')
  ipcMain.on('asynchronous-message', (event, arg) => {
    console.log(arg) // prints "ping"
    //event.sender.send('asynchronous-reply', 'pong')
  })
  ipcMain.on('asynchronous-searchsort', (event, arg) => {
    console.log('sorting by %s',arg) // prints "ping"
	p2pengine.sortResult(arg)
    //event.sender.send('asynchronous-reply', 'pong')
  })
  ipcMain.on('asynchronous-searchrequest', (event, arg) => {
var txtsearchreply
p2pengine.searchresults.length=0
    console.log('searching for :',arg) // prints "ping"
    p2pengine.sendSwarm('tradepunt-searchrequest;'+arg)
// DONE may need to be delayed
for (var reexec=0;reexec<10;reexec++){		setTimeout(function (){
	txtsearchreply=''
	for (var tmpresultid =0; tmpresultid<p2pengine.searchresults.length;tmpresultid++){
		if (p2pengine.searchresults[tmpresultid].filedirectory==='') {
		p2pengine.searchresults[tmpresultid].filedirectory = p2pengine.findFile(p2pengine.searchresults[tmpresultid].hash)
		}

		txtsearchreply+=p2pengine.searchresults[tmpresultid].description+';'+p2pengine.searchresults[tmpresultid].filedirectory+';'+p2pengine.searchresults[tmpresultid].distance+';'
		console.log('search result item ',txtsearchreply)
    		event.sender.send('asynchronous-searchrequest-reply', txtsearchreply)
	}

}, 1000);	}
  })
    ipcMain.on('asynchronous-additem', (event, arg) => {
    console.log('adding item description :',arg) // prints "ping"
    p2pengine.addItem(arg)
    //p2pengine.sendSwarm('tradepunt-searchrequest;'+arg)
    //event.sender.send('asynchronous-searchrequest-reply', 'pong')
  })
  ipcMain.on('asynchronous-addeditemsrequest', (event, arg) => {
    console.log('sending :',p2pengine.returnAddedItems()) // prints "ping"
    
    event.sender.send('asynchronous-addeditemsrequest-reply', p2pengine.returnAddedItems())
  })

  ipcMain.on('asynchronous-addfilerequest', (event, arg) => {
    var cachingfiledirectory='./cached/cachedfile'+(p2pengine.cachedfileslastid).toString() 
p2pengine.cachedfileslastid+=1
    var filehsh = p2pengine.addFile(arg,cachingfiledirectory)
    console.log('sending :%s',cachingfiledirectory+';'+filehsh+';') // prints "ping"
    
    event.sender.send('asynchronous-addfilerequest-reply', cachingfiledirectory+';'+filehsh+';')
  })

  ipcMain.on('asynchronous-deleteitem', (event, arg) => {
    console.log('deleting item number: %s',arg) // prints "ping"
	p2pengine.addeditems.splice(parseInt(arg), 1);
    
    //event.sender.send('asynchronous-addeditemsrequest-reply', p2pengine.returnAddedItems())
  })

  /*ipcMain.on('synchronous-message', (event, arg) => {
    console.log(arg) // prints "ping"
    event.returnValue = 'pong'
  })*/
//------------------------------------------------------
//------------------------------------------------------

function createWindow () {
  // Create the browser window.
//  mainWindow = new BrowserWindow({width: 800, height: 700})
 mainWindow = new BrowserWindow({titleBarStyle: 'hidden',
     width: 650,
     height: 700,
     minWidth: 650,
     minHeight: 400,
     //backgroundColor: '#312450',
     //show: false,
     icon: path.join(__dirname, 'icons/logo.png')
 })

//mainWindow.setMinimumSize(650,500)

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
//app.on('ready', createWindow)
app.on('ready', function(){
createWindow()

//setTimeout(function (){
p2pengine.start()
p2pengine.getLocation()
//}, 2000);

})


// Quit when all windows are closed.
app.on('window-all-closed', function () {
p2pengine.saveState()
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
