//=====================================================
/*:
/* @
*/


var tronWeb = new TronWeb({
	fullHost: 'https://api.shasta.trongrid.io'
})

//變數
var account;			//使用者錢包Account
var userBalance = 0;	//使用者TRX餘額
var contractAddress = 'TUkYSGSuHKCRdhqFdzfEAmcsMwUQSvDaUf';	//智能合約地址
var faucetAddress = "TCfNKFF4UPD2NjqtC4ck1cKnSGwPvwWkHv"; 	//老爸錢包
var faucetPrivateKey = "966e94792d6ec2fd7890eb6f9a3c3e785374fb49356d796814456b86cc1b4e77"; //老爸錢包的私鑰
var refreshFlag = false;	//是否需要刷新畫面

//建立新Account
var createAccount = async function () {
	var account = await tronWeb.createAccount();

	return account;
}

//取得TRX餘額
var getTRXBalance = async function () {
	var balance = await tronWeb.trx.getBalance(account.address);
	userBalance = balance / 1000000;

	$gameVariables.setValue(2, userBalance);
	refreshFlag = true;
}

//檢查聖劍並加入背包
async function chkItemOnChain() {
	// 聖劍數量
	var lv0countOC = 0;
	var lv1countOC = 0;
	var lv2countOC = 0;
	var lv3countOC = 0;
	var lv0count = 0
	var lv1count = 0
	var lv2count = 0
	var lv3count = 0

	var myContract = await tronWeb.contract().at(this.contractAddress)

	var totalSwordsNum = await myContract.totalSwordsNum().call();
	for (var i = 0; i < totalSwordsNum; i++) {
		
		let sword = await myContract.getSword(i).call();
		var data = await myContract.ownerOf(i).call();

		if (tronWeb.address.fromHex(data) == account.address) {
			switch(sword.level)
			{
				case 0:
					lv0countOC++;
					break;
				case 1:
					lv1countOC++;
					break;
				case 2:
					lv2countOC++;
					break;
				default:
					lv3countOC++;
					break;
			}
		}

	}

	if ($gameActors._data[1]._equips[0]._itemId == 1) {
		lv0count += 1;
	}
	if ($gameParty._weapons[1] >= 0) {
		lv0count += $gameParty._weapons[1];
	}

	if (lv0countOC == 0 && $gameActors._data[1]._equips[0]._itemId == 1) {
		$gameActors._data[1]._equips[0].setObject(null);
		lv0count -= 1;
	}

	$gameParty.gainItem($dataWeapons[1], (lv0countOC - lv0count), false);

	if ($gameActors._data[1]._equips[0]._itemId == 2) {
		lv1count += 1;
	}
	if ($gameParty._weapons[2] >= 0) {
		lv1count += $gameParty._weapons[2];
	}

	if (lv1countOC == 0 && $gameActors._data[1]._equips[0]._itemId == 2) {
		$gameActors._data[1]._equips[0].setObject(null);
		lv1count -= 1;
	}

	$gameParty.gainItem($dataWeapons[2], (lv1countOC - lv1count), false);

	if ($gameActors._data[1]._equips[0]._itemId == 3) {
		lv2count += 1;
	}
	if ($gameParty._weapons[3] >= 0) {
		lv2count += $gameParty._weapons[3];
	}

	if (lv2countOC == 0 && $gameActors._data[1]._equips[0]._itemId == 3) {
		$gameActors._data[1]._equips[0].setObject(null);
		lv2count -= 1;
	}

	$gameParty.gainItem($dataWeapons[3], (lv2countOC - lv2count), false);

	if ($gameActors._data[1]._equips[0]._itemId == 4) {
		lv3count += 1;
	}
	if ($gameParty._weapons[4] >= 0) {
		lv3count += $gameParty._weapons[4];
	}

	if (lv3countOC == 0 && $gameActors._data[1]._equips[0]._itemId == 4) {
		$gameActors._data[1]._equips[0].setObject(null);
		lv3count -= 1;
	}

	$gameParty.gainItem($dataWeapons[4], (lv3countOC - lv3count), false);
}

//發送TRX
var sendTRX = async function (toAddress, amount) {
	//檢查地址格式
	if (!tronWeb.isAddress(toAddress)) {
		Promise.reject('地址格式錯誤')
	}

	//將address設定至tronweb中
	await tronWeb.setAddress(account.address);

	//打包交易
	var transactionBuild = await tronWeb.transactionBuilder.sendTrx(
		toAddress,
		amount * 1000000
	);

	//用私鑰簽署交易
	var signedTransaction = await tronWeb.trx.sign(
		transactionBuild,
		account.privateKey
	);
	
	//發送已簽署交易
	var sendResult = await tronWeb.trx.sendRawTransaction(
		signedTransaction
	).catch(err => Promise.reject(
		'Failed to broadcast transaction'
	));

	if (sendResult.result === true) {
		var txID = sendResult.transaction.txID;

		//檢查交易是否上鏈confirmed
		var txComfirmed = false;
		while (txComfirmed === false) {
			var transactionInfo = await tronWeb.trx.getTransactionInfo(txID);
			txComfirmed = transactionInfo.hasOwnProperty('blockNumber');

			if (txComfirmed === false) {
				window.setTimeout(100);
			}
		}
	}
}

//老爸給TRX
var giveTRX = async function (toAddress, amount) {
	var result = await tronWeb.trx.sendTransaction(toAddress, amount * 1000000, faucetPrivateKey)
		.catch(err => {
			alert('爸爸沒錢了, 請洽Spirit創辦人');
			return;
		});

	if (result.result == true) {
		var txID = result.transaction.txID;

		var txComfirmed = false;
		while (txComfirmed == false) {
			var transactionInfo = await tronWeb.trx.getTransactionInfo(txID);
			txComfirmed = transactionInfo.hasOwnProperty('blockNumber');

			if (txComfirmed == false) {
				window.setTimeout(100);
			}
		}
	}
	
	getTRXBalance();

	alert('獲得 ' + amount + ' TRX');
}

var randomAlert = function() {
	var rnd = Math.floor(Math.random() * 5) + 1;

	if (rnd == 1) {
		alert('贏了會所嫩模，輸了下海幹活。 你施捨了曾經是比特幣富豪現在卻在公園睡紙箱的哥布林。');
	} else if (rnd == 2) {
		alert('正所謂"一幣一嫩模"，但是哥布林拿走了你 1 TRX。');
	} else if (rnd == 3) {
		alert('被當韭菜收割了 1 TRX。');
	} else if (rnd == 4) {
		alert('瀑布算個球，富貴險中求。 被路上的哥布林騙了參加到詐騙ICO，慘賠 1 TRX。');
	} else if (rnd == 5) {
		alert('幣圈一天，人間一年。 哥布林也悄悄的拿走了你 1 TRX。');
	}
}

var isvarisabGameDataSaveSQL = 0;
var setWidth = 0;
var setHeight = 0;
var setWinX = 0;
var setWinY = 0;
var isVarisabsWin = 0;
var isVarisabsGameDataSaveSQL = 0;
var gtxErr;
var gtxpoName = String( gtxpoName );


var Tron_commandNewGame = Scene_Title.prototype.commandNewGame;
Scene_Title.prototype.commandNewGame = function() {
	Tron_interpreterCommand.apply(this);
    DataManager.setupNewGame();
    this._commandWindow.close();
	this.fadeOutAll();
	
	createAccount().then(function(data){

		//放key進全域變數
		$gameStrinVar[0] = data.address.base58;		//地址
		$gameStrinVar[1] = data.privateKey;			//私鑰

		SceneManager.goto(Scene_Map);
	})
};

//Plugubs serup
var Tron_interpreterCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = async function(command, args){
	Tron_interpreterCommand.apply(this);

	if(command == "tron"){
		switch(args[0]){
			case "GiveTRX":
				giveTRX(account.address, 50);

				break;

			case "SendTRX":

				// 先檢查餘額是否足夠
				var userBalance = await tronWeb.trx.getBalance(account.address);

				if (userBalance == 0) {
					alert('還好沒TRX了, 不用收')
					break;
				}

				sendTRX(faucetAddress, 1).then(function() {
					randomAlert();
					getTRXBalance();
				})

				break;

			// case "Bet":
			// 	// 先檢查餘額是否足夠
			// 	var userBalance = await tronWeb.trx.getBalance(accounts[0]);

			// 	if (userBalance < 1000000) {
			// 		alert('TRX餘額不足')
			// 	}

			// 	var myContract = await tronWeb.contract().at(contractAddress)

			// 	var result = await myContract.allIn().send({
			// 		feeLimit: 100000000,
			// 		callValue: 10000000,
			// 		shouldPollResponse: true
			// 	}).catch(err => {
			// 		console.log(err)
			// 		// if (err.error == 'REVERT opcode executed') {

			// 		// }
			// 		alert('錢包TRX餘額不足');
			// 	});

			// 	//error: "REVERT opcode executed"
			// 	console.log(result);

			// 	if (result) {
			// 		alert('賭博獲勝');
			// 	} else {
			// 		alert('賭博失敗');
			// 	}

			// 	//刷新使用者餘額
			// 	getTRXBalance();
			// 	break;

			// case "SendERC721":
			// 	// 事件填在這邊
			// 	alert('我send 721')
			// 	break;

			// case "GetMySword":
			// 	// 事件填在這邊
			// 	chkItemOnChain();
			// 	break;

			case "BuySword":
				// 先檢查餘額是否足夠
				var userBalance = await tronWeb.trx.getBalance(account.address);

				if (userBalance < 1000000) {
					alert('TRX餘額不足')
					break;
				}

				//將privateKey設定至tronweb中
				await tronWeb.setPrivateKey(account.privateKey);

				//初始化智能合約
				var myContract = await tronWeb.contract().at(contractAddress)

				//呼叫智能合約中createSword function
				var result = await myContract.createSword('HolySword').send({
					feeLimit: 100000000,		//手續費上限
					callValue: 1000000,			//打多少TRX進智能合約
					shouldPollResponse: true	//等待至確定上鏈
				}).catch(err => {
					console.log(err)
				});

				getTRXBalance();
				chkItemOnChain();

				break;

			case "LevelUpSword":
				// 先檢查餘額是否足夠
				var balance = await tronWeb.trx.getBalance(account.address);

				if (balance < 1000000) {
					alert('TRX餘額不足')
					break;
				}
				
				var myContract = await tronWeb.contract().at(contractAddress)

				//抓使用者的聖劍編號
				var swordID;
				var totalSwordsNum = await myContract.totalSwordsNum().call();
				for (var i = 0; i < totalSwordsNum; i++) {

					let sword = await myContract.getSword(i).call();
					var data = await myContract.ownerOf(i).call();

					if (tronWeb.address.fromHex(data) == account.address) {
						swordID = i;
					}
				}

				console.log(swordID);

				//將privateKey設定至tronweb中
				await tronWeb.setPrivateKey(account.privateKey);

				var result = await myContract.levelUp(swordID).send({
					feeLimit: 100000000,
					callValue: 10000000,
					shouldPollResponse: true
				}).catch(err => {
					alert('錢包TRX餘額不足');
				});

				console.log(result);

				if (result) {
					let sword = await myContract.getSword(swordID).call();
					alert('升級成功，當前等級為' + sword.level);
				} else {
					alert('升級失敗');
				}

				//刷新使用者餘額
				getTRXBalance();
				chkItemOnChain();
				break;
		}
	}
}



function Window_VariableHUD(){
	this.initialize.apply(this,arguments);
}

Window_VariableHUD.prototype = Object.create(Window_Base.prototype);
Window_VariableHUD.prototype.constructor = Window_VariableHUD;

Window_VariableHUD.prototype.initialize = function(x,y){
	var width = 816;
	var height = 624;
	
	Window_Base.prototype.initialize.call(this,x,y,width,height);

	this.refresh();
}

//即時更新設定

var TronTest_update = Window_VariableHUD.prototype.update;
Window_VariableHUD.prototype.update = function(){
	TronTest_update.call(this);
	
	this.refresh();
}

//回傳視窗寬高
Window_VariableHUD.prototype.windowWidth = function(){
	return width;
}

Window_VariableHUD.prototype.windowHeight = function(){
	return height;
}

//文字數據即時變動
Window_VariableHUD.prototype.refresh = function(){
	// 事件填在這邊
	{
		//放key進全域變數
		if (!account) {
			console.log('-------- refresh --------')
			account = {
				address: $gameStrinVar[0],
				privateKey: $gameStrinVar[1]
			}
			console.log(account)

			//取得餘額
			console.log('-------- call getTRXBalance --------')

			getTRXBalance();
		}

		if (refreshFlag) {
			this.contents.clear();

			this.drawText("錢包地址：" + account.address, 10, 10, 816);
			this.drawText("TRX：" + userBalance, 10, 50, 400);

			refreshFlag = false;
		}

		// this.contents.clear();

		// this.drawText("錢包地址：" + account.address, 10, 10, 816);
		// this.drawText("TRX：" + userBalance, 10, 50, 400);

		// var dt = new Date();
		// this.drawText("時：" + dt.getHours(), 10, 90, 400);
		// this.drawText("分：" + dt.getMinutes(), 10, 120, 400);
		// this.drawText("秒：" + dt.getSeconds(), 10, 150, 400);
	}
}

Window_VariableHUD.prototype.open = function(){
	this.refresh();
	Window_Base.prototype.open.call(this);
}

var TronTest_mapStart = Scene_Map.prototype.start;
Scene_Map.prototype.start = function(){
	TronTest_mapStart.call(this);
	this.createVariableWindow();
}

Scene_Map.prototype.createVariableWindow = function(){
	this._varWindow = new Window_VariableHUD();
	this._varWindow.opacity = isVarisabsWin;
	this._varWindow.x = setWinX;
	this._varWindow.y = setWinY;
	this.addChildAt(this._varWindow,3)
}

Scene_Map.prototype.fadeInForTransfer = function() {
    var fadeType = $gamePlayer.fadeType();
    switch (fadeType) {
    case 0: case 1:
        this.startFadeIn(this.fadeSpeed(), fadeType === 1);
        break;
	}
	
	refreshFlag = true;
};


var gameStrinVar

function Game_StringVar() {
    this.initialize.apply(this, arguments);
}

Game_StringVar.prototype.initialize = function() {
    this.clear();
};

Game_StringVar.prototype.clear = function() {
    this._data = [];
};

Game_StringVar.prototype.value = function(variableId) {
    return this._data[variableId] || "";
};

Game_StringVar.prototype.setValue = function(variableId, value) {
    this._data[variableId] = value;
    this.onChange();
};

Game_StringVar.prototype.onChange = function() {
    $gameMap.requestRefresh();
};


DataManager.createGameObjects = function() {
    $gameTemp          = new Game_Temp();
    $gameSystem        = new Game_System();
    $gameScreen        = new Game_Screen();
    $gameTimer         = new Game_Timer();
    $gameMessage       = new Game_Message();
    $gameSwitches      = new Game_Switches();
    $gameVariables     = new Game_Variables();
    $gameSelfSwitches  = new Game_SelfSwitches();
    $gameActors        = new Game_Actors();
    $gameParty         = new Game_Party();
    $gameTroop         = new Game_Troop();
    $gameMap           = new Game_Map();
    $gamePlayer        = new Game_Player();
    $gameStrinVar      = new Game_StringVar();
};

DataManager.makeSaveContents = function(command, args){
    var contents = {};
    contents.system       = $gameSystem;
    contents.screen       = $gameScreen;
    contents.timer        = $gameTimer;
    contents.switches     = $gameSwitches;
    contents.variables    = $gameVariables;
    contents.selfSwitches = $gameSelfSwitches;
    contents.actors       = $gameActors;
    contents.party        = $gameParty;
    contents.map          = $gameMap;
    contents.player       = $gamePlayer;
    contents.strvar       = $gameStrinVar;
    return contents;
}

DataManager.extractSaveContents = function(contents) {
    $gameSystem        = contents.system;
    $gameScreen        = contents.screen;
    $gameTimer         = contents.timer;
    $gameSwitches      = contents.switches;
    $gameVariables     = contents.variables;
    $gameSelfSwitches  = contents.selfSwitches;
    $gameActors        = contents.actors;
    $gameParty         = contents.party;
    $gameMap           = contents.map;
    $gamePlayer        = contents.player;
    $gameStrinVar      = contents.strvar;
};

DataManager.maxSavefiles = function () {
	return 1;
};