const prettyMilliseconds = require('pretty-ms');
class kPlaytime {

    constructor(omegga, config, store) {
    this.omegga = omegga;
    this.config = config;
    this.store = store;
    }

    async init() {
        // players is just one player but im too lazy to change all references
        // possible features: leaderboards command, view webserver total playtime, export/import plugins or webservers playtimes
        this.omegga.on("join", async (player) => {

            let name = (player.name).toLowerCase().replace(" ", "_");
            let players = await this.store.get("playertime:" + name) || undefined;
            let players2 = await this.store.get("playertime:" + player.name) || undefined;

            if (players != undefined && players2 == undefined) {

                let date = Date.now();
                players.lastJoin = date;
                this.omegga.broadcast(`<color="aaa"><b><color="5a7">${player.name}</></> last joined <color="c85"><b>${prettyMilliseconds(players.lastJoin - players.lastLeave)}</></> ago</>`);
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
                await this.store.set("playertime:" + name, players2);
                
            } else {
                  
                let date = Date.now();
                const plr = ({firstJoin:date, lastJoin:date, lastLeave:0, totaltime:0});
                players = plr;
                this.omegga.broadcast(`<color="aaa"><b><color="5a7">${player.name}</></> added to playtime tracking</>`);
                await this.store.set("playertime:" + name, players);

            }
        });
        this.omegga.on("leave", async (player) => {

            let name = (player.name).toLowerCase().replace(" ", "_");
            let players = await this.store.get("playertime:" + name) || undefined;

            if (players != undefined) {

                let date = Date.now();
                players.lastLeave = date;
                let diff = (players.lastLeave - players.lastJoin);
                players.totaltime += diff;
                await this.store.set("playertime:" + name, players);

            } else {          
            }
        });
        this.omegga.on("chatcmd:playtime", async (name, ...args) => {
            let othername = args.join(" ").toLowerCase().replace(" ","_");
            let name2 = name.toLowerCase().replace(" ", "_");
            let players = await this.store.get("playertime:" + name2) || undefined;
            let players2 = await this.store.get("playertime:" + othername) || undefined;
            if(othername != '') {
                if (players2 == undefined) {
                    this.omegga.whisper(name, `<color="aaa">No player found named '<b><color="5a7">${othername}</></>'</>`)
                } else {
                    let people = this.omegga.getPlayers();
                    let people2 = [];
                    console.log(people)
                    for (const e of people) {
                        (e.name).toLowerCase().replace(" ", "_");
                        people2.push(e);
                    }
                    if (people2.find(c => c.name == name2)) {
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
        this.omegga.on("chatcmd:firstjoin", async (name, ...args) => {
            let othername = args.join(" ").toLowerCase().replace(" ","_");
            let name2 = name.toLowerCase().replace(" ", "_");
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
        this.omegga.on("chatcmd:leaderboards", async (name) => {
            console.log("test");
            for (let i = 0; i >= this.store.count; i++) {
                console.log(this.store);
            }
        });

        this.omegga.on ("chatcmd:plytime:clearstore", async (name, confirm, othername) => {
            if (this.config['authorized-users'].find(c => c.name == name)) {
                if (confirm == "confirm"){
                    if (othername != undefined){
                        let name2 = othername.toLowerCase().replace(" ", "_");
                        await this.store.delete("playertime:" + name2);
                        this.omegga.whisper(name, `<color="f33">${name2}'s Playertime cleared.</>`);
                    } else {
                        this.store.wipe();
                        this.omegga.whisper(name, '<color="f33">Playertimes cleared.</>');
                    }
                } else {
                    this.omegga.whisper(name, `<color="aaa">Type <b><color="f99">'!plytime:clearstore confirm (name)'</></> to confirm this action.</>`);
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
    }
  
    // omegga.webserver.database.getPlayer(id) yre
    async stop() {  
    }
}
module.exports = kPlaytime;
