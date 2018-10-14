const crypto = require('crypto')
const Swarm = require('discovery-swarm')
const defaults = require('dat-swarm-defaults')
const getPort = require('get-port')
const readline = require('readline')


var iplocation = require('iplocation')

const fs = require('fs')

const jsonfile = require('jsonfile')
const statefile = './state.json'

 // Here we will save our TCP peer connections
 // using the peer id as key: { peer_id: TCP_Connection }
 
const peers = {}
// Counter for connections, used for identify connections
let connSeq = 0

// Peer Identity, a random hash for identify your peer
const myId = crypto.randomBytes(32)
console.log('Your identity: ' + myId.toString('hex'))



// * Default DNS and DHT servers
// * This servers are used for peer discovery and establishing connection

const config = defaults({
  // peer-id
  id: myId,
})

// discovery-swarm library establishes a TCP p2p connection and uses
// discovery-channel library for peer discovery
 
const sw = Swarm(config)

mylatitude=0.0
mylongitude=0.0

module.exports=new class {
constructor() {
this.cachedfileslastid =0
this.searchcachedfileslastid =0
this.cachedfiles = []
this.searchresults = []
this.addeditems= []



}
start(){

jsonfile.readFile(statefile,this)
  .then(obj => {this.cachedfileslastid=obj.cachedfileslastid
		this.cachedfiles=obj.cachedfiles
		this.addeditems=obj.addeditems
}
)
  .catch(error => console.log(error))

;(async () => {

  // Choose a random unused port for listening TCP peer connections
  const port = await getPort()

  sw.listen(port)
  console.log('Listening to port: ' + port)

  
  // * The channel we are connecting to.
  // * Peers should discover other peers in this channel
 
  sw.join('tradepunt-channel')

  sw.on('connection', (conn, info) => {
    // Connection id
    const seq = connSeq

    const peerId = info.id.toString('hex')
    console.log(`Connected #${seq} to peer: ${peerId}`)
    
    // Keep alive TCP connection with peer
    if (info.initiator) {
      try {
        conn.setKeepAlive(true, 600)
      } catch (exception) {
        console.log('exception', exception)
      }
    }

    conn.on('data', data => {
      // Here we handle incomming messages
	var strdata=data.toString()

	console.log('!!!!! length data %d',data.length);
      //---------------------------------------------
		var arr=strdata.split(';')
			if (arr[0].toString()==='tradepunt-searchresult'){
			console.log('searchresult description : %s',arr[1])
			console.log('searchresult file hash : %s',arr[2])
			var newresult={	description:arr[1].toString(),
				hash:arr[2].toString(),
				filedirectory:'',
				distance:getDistanceFromLatLonInKm(mylatitude,mylongitude,arr[3],arr[4])
				}
			this.searchresults.push(newresult)
			
			//---------------------------------------------------
			
			} else if (arr[0].toString()==='tradepunt-searchrequest'){
			console.log('remote search request for : %s',arr[1])

			//---------------------------------------------------
			//-------------------------------------------------
			for (var tmpsrchi =0; tmpsrchi<this.addeditems.length;tmpsrchi++){
				if (this.addeditems[tmpsrchi].description.search(arr[1])>=0){
				//setTimeout(function (){
				this.sendPeerItem(this.addeditems[tmpsrchi].description,this.addeditems[tmpsrchi].filedirectory,this.addeditems[tmpsrchi].hash,peerId)
				//}, 100);
				}
			}
			} else {//if (data.length>1000){
			console.log('receiving file !!')
			var newhash = crypto.createHash('sha256');
			newhash.update(data);
			var newdatahsh=newhash.digest('hex')
			var newfiledirectory='cached/searchcachedfile'+(this.searchcachedfileslastid).toString()
			var newfile={	directory:newfiledirectory,
				hash:newdatahsh
				//datacached://TODO
				}
			this.cachedfiles.push(newfile) //TODO check if the same hash already exist
			this.searchcachedfileslastid+=1
			this.cacheFile(data,newfiledirectory)
			}
		//}
      //---------------------------------------------
      //---------------------------------------------
    }) 

    conn.on('close', () => {
      // Here we handle peer disconnection
      console.log(`Connection ${seq} closed, peer id: ${peerId}`)
      // If the closing connection is the last connection with the peer, removes the peer
      if (peers[peerId].seq === seq) {
        delete peers[peerId]
      }
    })

    // Save the connection
    if (!peers[peerId]) {
      peers[peerId] = {}
    }
    peers[peerId].conn = conn
    peers[peerId].seq = seq
    connSeq++

  })


  // Read user message from command line
   

})()


}

//---------------------------------------
saveState(){
jsonfile.writeFile(statefile, this)
  .then(res => {
    console.log('Write complete')
  })
  .catch(error => console.error(error))
}
//---------------------------------------
returnAddedItems(){

var str=''
for (var i = 0; i < this.addeditems.length; i++)
	str+=this.addeditems[i].description+';'+this.addeditems[i].filedirectory+';'


return str;
}
//---------------------------------------
findFile(hash){
for (var i=0;i<this.cachedfiles.length;i++){
if (this.cachedfiles[i].hash===hash){
 return this.cachedfiles[i].directory
}
}

}
//---------------------------------------
addItem(newdescription){
var itemarr=newdescription.split(';')
	var newitem={	description:itemarr[0],
				filedirectory:itemarr[1],
				hash:itemarr[2]
				//datacached://TODO
		 }
	this.addeditems.push(newitem)
}
cacheFile(data,filedirectory){
const buf2 = new Buffer.from(data,'binary')
if (filedirectory!=''){
fs.writeFile(filedirectory, buf2, (err) => {
  if (err) throw err;
  console.log('The file has been saved! length %d',buf2.length);

}); 
}
}
//---------------------------------------
addFile(filedirectory,cachingfiledirectory){
const hash = crypto.createHash('sha256');

console.log('adding cached file %s',cachingfiledirectory.toString())
var data=fs.readFileSync(filedirectory.toString())
hash.update(data);
	var datahsh=hash.digest('hex')
    console.log('hash of data %s',datahsh)

this.cacheFile(data,cachingfiledirectory)
var newaddedfile={	directory:cachingfiledirectory,
				hash:datahsh
				//datacached://TODO
				}
			this.cachedfiles.push(newaddedfile) //TODO check if the same hash already exist

return datahsh

}
//---------------------------------------
sendPeerItem(message,filedirectory,hash,peerId){

if (filedirectory!=''){
fs.readFile(filedirectory, (err, data) => {
  if (err) throw err;
  console.log('sending file length %d',data.length);

peers[peerId].conn.write('tradepunt-searchresult;'+message.toString()+';'+hash+';'+mylatitude+ ';'+mylongitude+';')

setTimeout(function (){

  // Something you want delayed.
peers[peerId].conn.write(data)

}, 10);


});

}
	     
}
//---------------------------------------
//---------------------------------------
sendPeer(message,peerId){
 			     peers[peerId].conn.write(message)

}
//---------------------------------------
sendSwarm(text){

    // Broadcast to peers
    for (let id in peers) {
      peers[id].conn.write(text)
    }

}
//----------------------------------------
sortResult(sortby){
//TODO not only distance but other types of sorting


this.searchresults.sort(function(a, b) {
    return parseFloat(a.distance) - parseFloat(b.distance);
});

}
//----------------------------------------
getLocation(){

var http = require('http');
http.get('http://bot.whatismyipaddress.com', function(res){
    res.setEncoding('utf8');
    res.on('data', function(chunk){
	iplocation(chunk, function (error, res) {
mylatitude=res.latitude
mylongitude=res.longitude


})
    });
});

}
//----------------------------------------

}
//-----------------------------------------
//-----------------------------------------
//-----------------------------------------
function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}
