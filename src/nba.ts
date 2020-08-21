import * as vscode from 'vscode';

const https = require('https');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');

// 定义一个状态栏的属性
let NBA_Bar: vscode.StatusBarItem;
let show_interval: any;
let req_interval: any;
let count: number = 0;

export function NBABar({ subscriptions }: vscode.ExtensionContext) {
    // 如果该属性不存在就创建一个
    if(!NBA_Bar) {
        NBA_Bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    }
    const nbaShow = vscode.commands.registerCommand('nbaBarShow', () => {
		clearInterval(req_interval);
		updateStatusBarItem();
		req_interval = setInterval( () => {
			updateStatusBarItem();
		},30000);
		console.log('show');
    });
    const nbaHide = vscode.commands.registerCommand('nbaBarHide', () => {
		clearInterval(show_interval);
		console.log('hide');
        NBA_Bar.hide();
	});
	subscriptions.push(vscode.commands.registerCommand('clickBar', () => {
		vscode.window.showInformationMessage(`Yeah, line(s) selected... Keep going!`);
	}));
	NBA_Bar.command = 'clickBar';
	subscriptions.push(nbaShow,nbaHide,NBA_Bar);
}

function updateStatusBarItem(): void {
	let option = {
		hostname: 'm.hupu.com',
		path: '/nba/game',
		headers: {
			Accept: '*/*',
			'Accept-Encoding': 'utf-8', // 这里设置返回的编码方式 设置其他的会是乱码
			'Accept-Language': 'zh-CN,zh;q=0.9',
			Connection: 'keep-alive',
			'Cache-Control': 'no-cache',
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
		},
	};
	https.get(option, (res: any) => {
		let html = '';
		res.on('data', (r:any) => {
			html += r; // 页面转码 避免乱码
		});
		res.on('end', () => {
			// console.log(html);
			const $ = cheerio.load(html);
			let content = $('#J_content').children('.match-today').find('a');
			// console.log(content.length)
			let data: any = [];
			for(let i = 0; i < content.length; i++){
				let match = content[i];
				let url = `m.hupu.com + ${$(match).attr('href')}`; //文字直播地址
				let awayTeam = $(match).find('.away-team').children('span').text(); //客队
				let homeTeam = $(match).find('.home-team').children('span').text(); //主队
				let score = $(match).find('strong').children('span').text(); //比分
				// console.log(url, awayTeam, homeTeam, score);
				data.push({ url, awayTeam, homeTeam, score });
			};
			// console.log(data);
            NBA_Bar.text = `${data[count].awayTeam} ${data[count].score} ${data[count].homeTeam}`;
            NBA_Bar.show();
            clearInterval(show_interval);
            show_interval = setInterval( () => {
                count = count < data.length - 1 ? count + 1 : 0;
                NBA_Bar.text = `$(megaphone) ${data[count].awayTeam} ${data[count].score} ${data[count].homeTeam}`;
                NBA_Bar.show();
            },3000);
		});
	});
};