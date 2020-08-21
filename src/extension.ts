
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {showStatusBar} from './statusBar';
// import {NBABar} from './nba';
const https = require('https');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
// 定义一个状态栏的属性
let NBA_Bar: vscode.StatusBarItem;
let Detail_Bar: vscode.StatusBarItem;
let show_interval: any;
let req_interval: any;
let detail_interval: any;
let count: number = 0;
let data: any = [];

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "helloworld-sample" is now active!');

	// // The command has been defined in the package.json file
	// // Now provide the implementation of the command with registerCommand
	// // The commandId parameter must match the command field in package.json
	// const disposable = vscode.commands.registerCommand('vscodeextens.helloWorld', () => {
	// 	// The code you place here will be executed every time your command is executed

	// 	// Display a message box to the user
	// 	vscode.window.showInformationMessage('Hello World!');
	// });

	// context.subscriptions.push(disposable);
	NBABar(context);
}
function NBABar({ subscriptions }: vscode.ExtensionContext) {

	NBA_Bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	
	// 显示比分指令
	subscriptions.push(vscode.commands.registerCommand('nbaBarShow', () => {
		clearInterval(show_interval); //清理定时器
		clearInterval(req_interval); //清理定时器
		updateStatusBarItem(); //更新比分
		req_interval = setInterval( () => {
			updateStatusBarItem();
		},5000);
	}));
	
	// 隐藏比分指令
    subscriptions.push(vscode.commands.registerCommand('nbaBarHide', () => {
		clearInterval(show_interval);
		clearInterval(req_interval);
        NBA_Bar.hide();
	}));
	
	// 显示详情 隐藏比分
	subscriptions.push(vscode.commands.registerCommand('showDetail', () => {
		// 清空比分相关定时器 隐藏比分
		clearInterval(show_interval);
		clearInterval(req_interval);
		NBA_Bar.hide();
		// 显示详情
		showDetail(subscriptions);
		detail_interval = setInterval( () => {
			showDetail(subscriptions);
		},2000);
	}));
	NBA_Bar.command = "showDetail";
	subscriptions.push(NBA_Bar);

	Detail_Bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);

	// 隐藏详情 重新显示比分
	subscriptions.push(vscode.commands.registerCommand('hideDetail', () => {
		Detail_Bar.hide();
		clearInterval(detail_interval);
		// 显示比分
		updateStatusBarItem(); //更新比分
		req_interval = setInterval( () => {
			updateStatusBarItem();
		},5000);
	}));
	Detail_Bar.command = "hideDetail";
	subscriptions.push(Detail_Bar);
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
			for(let i = 0; i < content.length; i++){
				let match = content[i];
				let url = $(match).attr('href').split("/m.hupu.com")[1]; //文字直播地址
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
                NBA_Bar.text = `${data[count].awayTeam} ${data[count].score} ${data[count].homeTeam}`;
                NBA_Bar.show();
            },3000);
		});
	});
};

function showDetail(subscriptions: any) {
	let url = data[count].url;
	let option = {
		hostname: 'm.hupu.com',
		path: url,
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
			let live = [];
			let content = $('#J_content').find('li');
			// for(let i = 0; i < content.length; i++){
				let match = content[0];
				let time = $(match).find('.live-time').text(); //时间
				let text = $(match).find('.live-text').text(); //内容
				let score = $(match).find('live-score').text(); //比分
				// console.log(url, awayTeam, homeTeam, score);
				live.push({ time, text, score });
			// }
			Detail_Bar.text = `$(megaphone) ${live[0].time} ${live[0].text} ${live[0].score}`;
			// vscode.window.showInformationMessage(`${live[0].time} ${live[0].text} ${live[0].score}`);
		});
	});	
	Detail_Bar.show();
	
}