const prettyMilliseconds = require('pretty-ms');
class kPlaytime {

    constructor(omegga, config, store) {
    this.omegga = omegga;
    this.config = config;
    this.store = store;
    }

    async init() {
        // players is just one player but im too lazy to change all references
        // possible features: view webserver total playtime, export/import plugins or webservers playtimes

        // first if = returning player with new store key    second if = returning player with old store key, gets a new and deletes old    
        // third if = returning with new and old store key, shouldn't happen    fourth if = new player, make store key
        this.omegga.on("join", async (player) => {

            let plrname = player.name;
            let name = plrname.toLowerCase().replace(/ /gi,"_");
            let players = await this.store.get("playertime:" + name) || undefined;
            let players2 = await this.store.get("playertime:" + player.name) || undefined;

            if (players != undefined && players2 == undefined) {

                let date = Date.now();
                players.lastJoin = date;

                if (player.lastLeave != 0) {
                    this.omegga.broadcast(`<color="aaa"><b><color="5a7">${player.name}</></> last joined <color="c85"><b>${prettyMilliseconds(players.lastJoin - players.lastLeave)}</></> ago</>`);
                } else {
                    this.omegga.broadcast(`<color="aaa">No Last leave tracked</>`);
                }
                
                await this.store.set("playertime:" + name, players);

            } else if (players == undefined && players2 != undefined) {

                let date = Date.now();
                players2.lastJoin = date;
                this.omegga.broadcast(`<color="aaa"><b><color="5a7">${player.name}</></> last joined <color="c85"><b>${prettyMilliseconds(players2.lastJoin - players2.lastLeave)}</></> ago</>`);
                await this.store.set("playertime:" + name, players2);
                await this.store.delete("playertime:" + player.name);
                
            } else if (players != undefined && players2 != undefined) {

                await this.store.delete("playertime:" + player.name);
                let date = Date.now();
                players.lastJoin = date;
                this.omegga.broadcast(`<color="aaa"><b><color="5a7">${player.name}</></> last joined <color="c85"><b>${prettyMilliseconds(players.lastJoin - players.lastLeave)}</></> ago</>`);
                await this.store.set("playertime:" + name, players);
                
            } else {
                  
                let date = Date.now();
                const plr = ({firstJoin:date, lastJoin:date, lastLeave:0, totaltime:0});
                players = plr;
                this.omegga.broadcast(`<color="aaa"><b><color="5a7">${player.name}</></> added to playtime tracking</>`);
                await this.store.set("playertime:" + name, players);

            }
        });
        
        // get player data and update lastleave and totaltime
        this.omegga.on("leave", async (player) => {

            let name = (player.name).toLowerCase().replace(/ /gi,"_");
            let players = await this.store.get("playertime:" + name) || undefined;

            if (players != undefined) {

                let date = Date.now();
                players.lastLeave = date;
                let diff = (players.lastLeave - players.lastJoin);
                players.totaltime += diff;
                await this.store.set("playertime:" + name, players);

            }
        });

        this.omegga.on("cmd:playtime", async (name, ...args) => {

            let othername = args.join("_").toLowerCase();
            let name2 = name.toLowerCase().replace(/ /gi,"_");
            let players = await this.store.get("playertime:" + name2) || undefined;
            let players2 = await this.store.get("playertime:" + othername) || undefined;

            if(othername != '') {

                if (players2 == undefined) {
                    this.omegga.whisper(name, `<color="aaa">No player found named '<b><color="5a7">${othername}</></>'</>`)

                } else {
                    let people = this.omegga.getPlayers();
                    let people2 = [];

                    for (const e of people) {

                        let ee = e.name;
                        let eee = ee.toLowerCase().replace(/ /gi,"_");
                        people2.push(eee);

                    }

                    if (people2.find(c => c == othername) != undefined) {
                        let date = Date.now() - players2.lastJoin;
                        this.omegga.whisper(name, `<color="5a7"><b>${othername}</></><color="aaa"> has played on this server for <color="c85"><b>${prettyMilliseconds(players2.totaltime + date)}</></></>`)
                    } else {
                        this.omegga.whisper(name, `<color="5a7"><b>${othername}</></><color="aaa"> has played on this server for <color="c85"><b>${prettyMilliseconds(players2.totaltime)}</></></>`)
                    }

                }

            } else {
                let date = Date.now() - players.lastJoin;
                this.omegga.whisper(name, `<color="aaa">You have played on this server for <color="c85"><b>${prettyMilliseconds(players.totaltime + date)}</></></>`)

            }
        });

        this.omegga.on("cmd:firstjoin", async (name, ...args) => {
            let othername = args.join("_").toLowerCase();
            let name2 = name.toLowerCase().replace(/ /gi,"_");
            let players = await this.store.get("playertime:" + name2) || undefined;
            let players2 = await this.store.get("playertime:" + othername) || undefined;

            if(othername != '') {
                if (players2 == undefined) {
                    this.omegga.whisper(name, `<color="aaa">No player found named '<b><color="5a7">${othername}</></>'</>`)

                } else {
                    let date = Date.now() - players2.firstJoin;
                    let date2 = new Date(players2.firstJoin);
                    this.omegga.whisper(name, `<b><color="5a7">${othername}</></><color="aaa"> first joined <color="c85"><b>${prettyMilliseconds(date)}</></> ago, or on <color="c85"><b>${date2}</></></>`);

                }
            } else {
                let date = Date.now() - players.firstJoin;
                let date2 = new Date(players.firstJoin);
                this.omegga.whisper(name, `<color="aaa">You first joined <color="c85"><b>${prettyMilliseconds(date)}</></> ago, or on <color="c85"><b>${date2}</></></>`);

            }
        });
        this.omegga.on("cmd:leaderboard", async (name) => { //top10 can be less than 10
            let allKeys = await this.store.keys();
            let top = [];
            let top10 = [];
            let top10Formatted = [];
            let numbah = 0;
            let numbah2 = 0;

            for (const e of allKeys) {
                let stuff = await this.store.get(e)
                let yoosh = {name:(e.slice(11)),totaltime:stuff.totaltime};
                top.push(yoosh);
            }
            top.sort((a, b) => a.totaltime - b.totaltime);
            
            if (top.length >= 10) {
                top10 = top.slice(top.length-10, top.length);
            }
            top10.reverse()
            top = [];

            for (const e of top10) {
                numbah++
                numbah2++
                top10Formatted.push(` ${numbah} - <color="5a7">${e.name}</> = <color="c85">${prettyMilliseconds(e.totaltime)}</>`);
                if (numbah2 == 5) {
                    this.omegga.whisper(name, `<size="14">${top10Formatted}`);
                    numbah2 = 0;
                    top10Formatted = [];
                }
            }

            if (numbah2 != 5 && top10Formatted != []) {
                this.omegga.whisper(name, `<size="14">${top10Formatted}`);
                top10Formatted = [];
            }
            numbah = 0;
            numbah2 = 0;
        });

        this.omegga.on ("cmd:plytime:clearstore", async (name, confirm, ...args) => { //UNFINISHED
            if (this.config['authorized-users'].find(c => c.name == name)) {
                if (confirm == "confirm"){
                    if (othername != undefined){
                        let othername = args.join("_").toLowerCase();
                        let name2 = othername.toLowerCase().replace(/ /gi,"_");
                        await this.store.delete("playertime:" + name2);
                        this.omegga.whisper(name, `<color="f33">${name2}'s Playertime cleared.</>`);

                    } else {
                        this.store.wipe();
                        this.omegga.whisper(name, '<color="f33">Playertimes cleared.</>');

                    }
                } else {
                    this.omegga.whisper(name, `<color="aaa">Type <b><color="f99">'!plytime:clearstore confirm (optional name)'</></> to confirm this action.</>`);
                };
            } else {
                this.omegga.whisper(name, '<color="f99">You are not authorized.</>');
            }
        }); 

        this.omegga.on("chatcmd:plytime:test", async (name, othername) => {

            if (othername != undefined) {
                console.log(await this.store.get("playertime:" + othername));
            } else {
                console.log(await this.store.get("playertime:" + name));
            }
        }); 

        this.omegga.on("cmd:omeggaplaytime", async (name, ...args) => { //UNFINISHED
            let people = this.omegga.getPlayers();
            let name2 = name.toLowerCase().replace(/ /gi,"_");
            let othername = args.join(" ");

            if(othername != '') {
                people.find()
                    // omegga.webserver.database.getPlayer(id)

            } else {

            }
        });
    }
  
    async stop() {  
    }
}
module.exports = kPlaytime;
    