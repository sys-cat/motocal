var React = require('react');
var ReactDOM = require('react-dom');
var intl = require('./translate.js')
var {Chart} = require('react-google-charts')
var {Thumbnail, ControlLabel, Button, ButtonGroup, FormControl, Checkbox, Modal, Image, Popover} = require('react-bootstrap');
var {SimulationChart} = require('./chart.js')
var GlobalConst = require('./global_const.js')
var selector = GlobalConst.selector
var turnList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
var turnTypeList = {"normal": "通常攻撃", "ougi": "奥義", "ougiNoDamage": "奥義(ダメージ無し)"};
var HPList = [ 100, 99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85, 84, 83, 82, 81, 80, 79, 78, 77, 76, 75, 74, 73, 72, 71, 70, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60, 59, 58, 57, 56, 55, 54, 53, 52, 51, 50, 49, 48, 47, 46, 45, 44, 43, 42, 41, 40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1 ];
var buffAmountList = [
    0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150,
    -5, -10, -15, -20, -25, -30, -35, -40, -45, -50, -55, -60, -65, -70, -75, -80, -85, -90, -95, -100
];
var daBuffAmountList = [
    0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100,
    -5, -10, -15, -20, -25, -30, -35, -40, -45, -50, -55, -60, -65, -70, -75, -80, -85, -90, -95, -100
];

var buffTypeList = {
    "normal-30-3T": {
        "name": "レイジIII(通常攻刃30%, 3T)",
        "bufflists": ["normal_30"],
        "turn": 3,
    },
    "normal-40-3T": {
        "name": "レイジIV(通常攻刃40%, 3T)",
        "bufflists": ["norma__40"],
        "turn": 3,
    },
    "DATA-15-3T": {
        "name": "ランページ(DA20% TA10%, 3T)",
        "bufflists": ["DA_20", "TA_10"],
        "turn": 3,
    },
    "DATA-30-3T": {
        "name": "四天刃奥義(DA30% TA30%, 3T)",
        "bufflists": ["DA_30", "TA_30"],
        "turn": 3,
    },
    "tasinjin-ougi": {
        "name": "他心陣と奥義(HP50%, 奥義に設定)",
        "bufflists": ["remainHP_50", "ougi"],
        "turn": 1,
    },
}

var select_turnlist = turnList.map(function(opt){return <option value={opt} key={opt}>最大ターン数:{opt}</option>;});
var select_turntype = Object.keys(turnTypeList).map(function(opt){return <option value={opt} key={opt}>{turnTypeList[opt]}</option>;});
var select_normalbuffAmount = buffAmountList.map(function(opt){ return <option value={"normal_" + opt} key={opt}>通常バフ{opt}%</option> });
var select_elementbuffAmount = buffAmountList.map(function(opt){ return <option value={"element_" + opt} key={opt}>属性バフ{opt}%</option> });
var select_otherbuffAmount = buffAmountList.map(function(opt){ return <option value={"other_" + opt} key={opt}>その他バフ{opt}%</option> });
var select_dabuffAmount = daBuffAmountList.map(function(opt){ return <option value={"DA_" + opt} key={opt}>DA率{opt}%</option> });
var select_tabuffAmount = daBuffAmountList.map(function(opt){ return <option value={"TA_" + opt} key={opt}>TA率{opt}%</option> });
var select_ougigagebuffAmount = buffAmountList.map(function(opt){ return <option value={"ougiGage_" + opt} key={opt}>奥義ゲージ上昇量{opt}%</option> });
var select_additionalbuffAmount = buffAmountList.map(function(opt){ return <option value={"additionalDamage_" + opt} key={opt}>追加ダメージ{opt}%</option> });
var select_hplist = HPList.map(function(opt){return <option value={opt} key={opt}>残りHP:{opt}%</option>;});

var {generateSimulationData, getTotalBuff, getInitialTotals, treatSupportAbility, calcOneCombination, initializeTotals} = require('./global_logic.js')

var Simulator = React.createClass({
    makeTurnBuff: function() {
        var storedCombinations = this.props.storedList.combinations
        var storedArmlist = this.props.storedList.armlist

        var prof = this.props.prof; var armlist = this.props.armlist;
        var summon = this.props.summon; var chara = this.props.chara;

        var totalBuff = getTotalBuff(prof)
        var totals = getInitialTotals(prof, chara, summon)
        treatSupportAbility(totals, chara)

        var sortkey = "averageExpectedDamage"

        // var turnBuff = this.state.simulator;
        var maxTurn = this.state.maxTurn

        var res = []
        // res[summonid][turn][rank]にする
        for(var i = 0; i < summon.length; i++){
            res[i] = []
            for(var j = 0; j < maxTurn; j++){
                res[i][j] = []
            }
        }

        var buffs = this.state.buffs;

        for(var k = 0; k < maxTurn; k++){
            // 各ターン毎のバフ、HPなどをアレする
            totalBuff["normal"] = 0.01 * buffs["全体バフ"][k].normal
            totalBuff["element"] = 0.01 * buffs["全体バフ"][k].element
            totalBuff["other"] = 0.01 * buffs["全体バフ"][k].other
            totalBuff["da"] = 0.01 * buffs["全体バフ"][k].DA
            totalBuff["ta"] = 0.01 * buffs["全体バフ"][k].TA
            totalBuff["ougiGage"] = 0.01 * buffs["全体バフ"][k].ougiGage
            totalBuff["additionalDamage"] = 0.01 * buffs["全体バフ"][k].additionalDamage

            console.log("turn total buff = ", totalBuff)

            // 個別バフと残りHPを設定
            for(var key in totals) {
                totals[key].remainHP = (buffs["全体バフ"][k].remainHP > buffs[key][k].remainHP) ? 0.01 * buffs[key][k].remainHP : 0.01 * buffs["全体バフ"][k].remainHP
                totals[key].normalBuff = 0.01 * buffs[key][k].normal
                totals[key].elementBuff = 0.01 * buffs[key][k].element
                totals[key].otherBuff = 0.01 * buffs[key][k].other
                totals[key].DABuff = 0.01 * buffs[key][k].DA
                totals[key].TABuff = 0.01 * buffs[key][k].TA
                totals[key].ougiGageBuff = 0.01 * buffs[key][k].ougiGage
                totals[key].additionalDamageBuff = 0.01 * buffs[key][k].additionalDamage
            }

            for(var i = 0; i < storedCombinations.length; i++){
                var oneres = calcOneCombination(storedCombinations[i], summon, prof, armlist, totals, totalBuff)
                for(var j = 0; j < summon.length; j++){
                    res[j][k].push({data: oneres[j], armNumbers: storedCombinations[i]});
                }
                initializeTotals(totals)
            }
        }
        return generateSimulationData(res, this.state, armlist, summon, prof, totalBuff, chara, storedCombinations);
    },
    componentDidMount: function(){
        // Mount し終わった際のデータを
        // Root.state.simulatorに保存する
        this.props.onChange(this.state);
    },
    updateBuffList: function(oldState){
        var newState = {
            buffs: {},
            bufflists: {},
            maxTurn: oldState.maxTurn,
            openPersonalBuff: oldState.openPersonalBuff,
        }

        // 削除されてるかチェック
        for(var key in oldState.buffs) {
            if( (key == "全体バフ") || (key == "Djeeta") ){
                newState.buffs[key] = oldState.buffs[key]
                newState.bufflists[key] = oldState.bufflists[key]
            } else {
                var isCharaExist = false
                for(var i = 0; i < this.props.chara.length; i++) {
                    if(key == this.props.chara[i].name) isCharaExist = true
                }

                if(isCharaExist) {
                    newState.buffs[key] = oldState.buffs[key]
                    newState.bufflists[key] = oldState.bufflists[key]
                }
            }
        }

        // いなかったキャラの分を追加
        for(var i = 0; i < this.props.chara.length; i++){
            if(this.props.chara[i] != undefined) {
                var namekey = this.props.chara[i].name
                if(namekey != "" && !(namekey in newState.buffs)) {
                    newState.buffs[namekey] = {}
                    newState.bufflists[namekey] = {}

                    for(var j = 0; j < newState.maxTurn; j++) {
                        newState.buffs[namekey][j] = {
                            normal: 0,
                            element: 0,
                            other: 0,
                            DA: 0,
                            TA: 0,
                            ougiGage: 0,
                            additionalDamage: 0,
                            turnType: "normal",
                            remainHP: 100
                        }
                        newState.bufflists[namekey][j] = []
                    }
                }
            }
        }
        return newState
    },
    getInitialState: function() {
        var initState = {};

        // 毎回 Mount されるので
        // データロードはinitial state設定で行う
        // 初回は {} が降ってくるのでその場合は普通に初期化
        if(this.props.dataForLoad.maxTurn != undefined) {
            // 上から降ってきたデータはは
            // 現在の形に合わせる処理が必要になる
            initState = this.updateBuffList(this.props.dataForLoad)
        } else {
            var maxTurn = 4
            // 合計後のデータを入れる連想配列
            var buffs = {}
            // 各選択メニューに対応する連想配列
            var bufflists = {}
            buffs["全体バフ"] = {}
            buffs["Djeeta"] = {}
            bufflists["全体バフ"] = {}
            bufflists["Djeeta"] = {}

            for(var i = 0; i < this.props.chara.length; i++){
                if(this.props.chara[i].name != "") {
                    buffs[i] = {}
                    bufflists[i] = {}
                }
            }

            for(var i = 0; i < maxTurn; i++) {
                for(var key in buffs) {
                    buffs[key][i] = {
                            normal: 0,
                            element: 0,
                            other: 0,
                            DA: 0,
                            TA: 0,
                            ougiGage: 0,
                            additionalDamage: 0,
                            turnType: "normal",
                            remainHP: 100
                        }
                    bufflists[key][i] = []
                }
            }

            initState["buffs"] = buffs;
            initState["bufflists"] = bufflists;
            initState["maxTurn"] = maxTurn;
            initState["openPersonalBuff"] = false;
        }

        return initState;
    },
    updateBuffAmount: function(newState, name, ind){
        // 更新されたターンのところだけアップデートすればよい
        newState.buffs[name][ind].normal = 0
        newState.buffs[name][ind].element = 0
        newState.buffs[name][ind].other = 0
        newState.buffs[name][ind].DA = 0
        newState.buffs[name][ind].TA = 0
        newState.buffs[name][ind].ougiGage = 0
        newState.buffs[name][ind].additionalDamage = 0

        for(var i = 0; i < newState.bufflists[name][ind].length; i++) {
            var onebuff = newState.bufflists[name][ind][i].split("_")
            newState.buffs[name][ind][onebuff[0]] += parseInt(onebuff[1])
        }

        this.setState(newState)
        this.props.onChange(newState)
    },
    updateBuffAmountAllTurn: function(newState, name){
        for(var j = 0; j < this.state.maxTurn; j++) {
            newState.buffs[name][j].normal = 0
            newState.buffs[name][j].element = 0
            newState.buffs[name][j].other = 0
            newState.buffs[name][j].DA = 0
            newState.buffs[name][j].TA = 0
            newState.buffs[name][j].ougiGage = 0
            newState.buffs[name][j].additionalDamage = 0

            for(var i = 0; i < newState.bufflists[name][j].length; i++) {
                var onebuff = newState.bufflists[name][j][i].split("_")
                newState.buffs[name][j][onebuff[0]] += parseInt(onebuff[1])
            }
        }

        this.setState(newState)
        this.props.onChange(newState)
    },
    handleSelectEvent: function(key, e) {
        // select タイプの入力フォームはonChangeの際で良い
        var newState = this.state
        if(key == "maxTurn") {
            if(parseInt(this.state.maxTurn) < parseInt(e.target.value)) {
                // ターン数が増えた場合
                for(var i = parseInt(this.state.maxTurn); i < parseInt(e.target.value); i++) {
                    for(buffkey in newState.buffs) {
                        newState.buffs[buffkey][i] = {
                            normal: 0,
                            element: 0,
                            other: 0,
                            DA: 0,
                            TA: 0,
                            ougiGage: 0,
                            additionalDamage: 0,
                            turnType: "normal",
                            remainHP: 100
                        }
                        newState.bufflists[buffkey][i] = []
                    }
                }
            } else {
                // ターン数が減った場合
                for(var i = parseInt(this.state.maxTurn) - 1; i >= parseInt(e.target.value); i--) {
                    for(buffkey in newState.buffs) {
                        delete newState.buffs[buffkey][i];
                        delete newState.bufflists[buffkey][i];
                    }
                }
            }
        }
        newState[key] = parseInt(e.target.value)
        this.setState(newState)
        this.props.onChange(newState)
    },
    isDisplay: function(key) {
        if(key == "全体バフ") {
            return true;
        } else if(!this.state.openPersonalBuff) {
            return false;
        } else if(key == "Djeeta") {
            return true;
        } else {
            for(var i = 0; i < this.props.chara.length; i++){
                if(this.props.chara[i].name == key) {
                    return this.props.chara[i].isConsideredInAverage
                }
            }
        }
    },
    handleChangeBuff: function(e) {
        var newState = this.state
        var id = e.target.getAttribute("id").split("_")
        var name = e.target.getAttribute("name")
        newState.bufflists[name][id[0]][id[1]] = e.target.value
        this.updateBuffAmount(newState, name, id[0])
    },
    handleRemainHPChange: function(e) {
        var newState = this.state
        var name = e.target.getAttribute("name")
        var id = e.target.getAttribute("id")
        newState.buffs[name][id]["remainHP"] = parseInt(e.target.value)
        this.updateBuffAmount(newState, name, id)
    },
    handleTurnTypeChange: function(e) {
        var newState = this.state
        var name = e.target.getAttribute("name")
        var id = e.target.getAttribute("id")
        newState.buffs[name][id]["turnType"] = e.target.value
        this.updateBuffAmount(newState, name, id)
    },
    addBuffNum: function(e) {
        var newbuff = this.state.bufflists
        var key = e.target.getAttribute("name")
        var turn = e.target.getAttribute("id")
        newbuff[key][turn].push("normal_0")
        this.setState({bufflists: newbuff})
    },
    subBuffNum: function(e) {
        var newbuff = this.state.bufflists
        var key = e.target.getAttribute("name")
        var turn = e.target.getAttribute("id")
        if(newbuff[key][turn].length > 0) {
            newbuff[key][turn].pop()
            this.setState({bufflists: newbuff})
        }
    },
    copyBuffTo: function(e, direction) {
        var newState = this.state
        var keys = Object.keys(newState.bufflists)
        var name = e.target.getAttribute("name")
        var id = parseInt(e.target.getAttribute("id"))
        var index = 1
        if(direction == "up") {
            while(id - index >= 0) {
                if(this.isDisplay(keys[id - index])) {
                    newState.buffs[keys[id - index]] = JSON.parse(JSON.stringify(newState.buffs[name]))
                    newState.bufflists[keys[id - index]] = JSON.parse(JSON.stringify(newState.bufflists[name]))
                    // updateBuffAmount は必要ない（Buffsもコピーしているので）
                    this.props.onChange(newState)
                    break;
                } else {
                    index++;
                }
            }
        } else {
            while(id + index < keys.length) {
                if(this.isDisplay(keys[id + index])) {
                    newState.buffs[keys[id + index]] = JSON.parse(JSON.stringify(newState.buffs[name]))
                    newState.bufflists[keys[id + index]] = JSON.parse(JSON.stringify(newState.bufflists[name]))
                    // updateBuffAmount は必要ない（Buffsもコピーしているので）
                    this.props.onChange(newState)
                    break;
                } else {
                    index++;
                }
            }
        }
    },
    copyBuffToUP: function(e) {
        this.copyBuffTo(e, "up")
    },
    copyBuffToDown: function(e) {
        this.copyBuffTo(e, "down")
    },
    copyTo: function(e, direction) {
        var newState = this.state
        var name = e.target.getAttribute("name")
        var id = parseInt(e.target.getAttribute("id"))

        if(direction == "left") {
            if(id > 0) {
                newState.buffs[name][id - 1] = JSON.parse(JSON.stringify(newState.buffs[name][id]))
                newState.bufflists[name][id - 1] = JSON.parse(JSON.stringify(newState.bufflists[name][id]))
                // updateBuffAmount は必要ない（Buffsもコピーしているので）
                this.props.onChange(newState)
            }
        } else {
            if(id < this.state.maxTurn - 1) {
                newState.buffs[name][id + 1] = JSON.parse(JSON.stringify(newState.buffs[name][id]))
                newState.bufflists[name][id + 1] = JSON.parse(JSON.stringify(newState.bufflists[name][id]))
                this.props.onChange(newState)
            }
        }
    },
    copyToLeft: function(e) {
        this.copyTo(e, "left")
    },
    copyToRight: function(e) {
        this.copyTo(e, "right")
    },
    onDragStart: function(e) {
        e.dataTransfer.setData('buffDrag', e.target.id); 
    },
    onDropBuff: function(e) {
        e.preventDefault();
        try {
            var buffID = e.dataTransfer.getData('buffDrag');
        } catch (except) {
            return;
        }

        var buff = buffTypeList[buffID];
        var droppedTurn = parseInt(e.target.getAttribute("id"));
        var key = e.target.getAttribute("name");

        var state = this.state;

        for(var i = 0; i < droppedTurn + buff.turn; i++) {
            if(i < state.maxTurn) {
                for(var j = 0; j < buff.bufflists.length; j++) {
                    state.bufflists[key][i].push(buff.bufflists[j])
                }
            }
        }

        this.setState(state);
        this.updateBuffAmountAllTurn(state, key);
    },
    callPreventDefault: function(e) {
        e.preventDefault();
    },
    switchPersolalBuff: function(e) {
        this.setState({openPersonalBuff: (!this.state.openPersonalBuff)})
    },
    render: function() {
        var Turns = [];
        for(var i = 0; i < this.state.maxTurn; i++){
            Turns.push(i + 1)
        }
        var state = this.state
        var locale = this.props.locale
        var handleSelectEvent = this.handleSelectEvent
        var handleEvent = this.handleEvent
        var handleBuffDataChange = this.handleBuffDataChange
        var handleTurnTypeChange = this.handleTurnTypeChange
        var handleRemainHPChange = this.handleRemainHPChange
        var handleChangeBuff = this.handleChangeBuff
        var addBuffNum = this.addBuffNum
        var subBuffNum = this.subBuffNum
        var copyBuffToUP = this.copyBuffToUP
        var copyBuffToDown = this.copyBuffToDown
        var copyToLeft = this.copyToLeft
        var copyToRight = this.copyToRight
        var isDisplay = this.isDisplay
        var chartData = this.makeTurnBuff();
        var onDragStart = this.onDragStart;
        var onDropBuff = this.onDropBuff;
        var callPreventDefault = this.callPreventDefault;

        return (
            <div className="simulatorInput">
                <div>
                    {Object.keys(buffTypeList).map(function(key, ind){
                        return <Button bsStyle="success" style={{"margin": "0px 2px"}} bsSize="xsmall" draggable onDragStart={onDragStart} key={key} id={key}>{buffTypeList[key].name}</Button>
                    })}
                    <FormControl
                        componentClass="select"
                        value={state.maxTurn}
                        style={{"width": "150px", "float": "right"}}
                        onChange={this.handleSelectEvent.bind(this, "maxTurn")}>
                        {select_turnlist}
                    </FormControl>
                </div>
                <hr/>
                <table className="table table-bordered">
                    <tbody>
                    <tr>
                        <th className="simulator-left"></th>
                        {Turns.map(function(x){return <th className="simulator-th" key={x}>{x}ターン目</th>})}
                        <th className="simulator-th">操作</th>
                    </tr>
                    {Object.keys(state.buffs).map(function(key, ind){
                        if(isDisplay(key)) {
                            return (
                            <tr key={key}>
                                <td className="simulator-left">{key}</td>
                                {Turns.map(function(x, ind2){
                                    return (
                                        <td key={ind2} name={key} id={ind2} className="simulator-td" onDragOver={callPreventDefault} onDrop={onDropBuff} >
                                        <FormControl componentClass="select" name={key} id={ind2.toString()} value={state.buffs[key][ind2].turnType} onChange={handleTurnTypeChange}>{select_turntype}</FormControl>
                                        <FormControl componentClass="select" name={key} id={ind2.toString()} value={state.buffs[key][ind2].remainHP} onChange={handleRemainHPChange}>{select_hplist}</FormControl>

                                        {state.bufflists[key][ind2].map(function(v, ind3){
                                            return (
                                                <BuffListForm key={ind3} name={key} id={ind2.toString() + "_" + ind3.toString()} value={v} onChange={handleChangeBuff}/>
                                            );
                                        })}
                                        <hr style={{"margin": "2px 5px"}}/>
                                        <ButtonGroup>
                                            <Button bsStyle="default" className="btn-nopadding simulatorOperationButton" onClick={copyToLeft} name={key} id={ind2.toString()}><i name={key} id={ind2.toString()} className="fa fa-arrow-left" aria-hidden="true"></i></Button>
                                            <Button bsStyle="default" className="btn-nopadding simulatorOperationButton" onClick={addBuffNum} name={key} id={ind2.toString()}><i name={key} id={ind2.toString()} className="fa fa-plus-square" aria-hidden="true"></i></Button>
                                            <Button bsStyle="default" className="btn-nopadding simulatorOperationButton" onClick={subBuffNum} name={key} id={ind2.toString()}><i name={key} id={ind2.toString()} className="fa fa-minus-square" aria-hidden="true"></i></Button>
                                            <Button bsStyle="default" className="btn-nopadding simulatorOperationButton" onClick={copyToRight} name={key} id={ind2.toString()}><i name={key} id={ind2.toString()} className="fa fa-arrow-right" aria-hidden="true"></i></Button>
                                        </ButtonGroup>
                                        </td>
                                    );
                                })}
                                <td className="simulator-td">
                                    <Button bsStyle="primary" block style={{"width": "75%", "margin": "10px 12.5%"}} name={key} id={ind.toString()} onClick={copyBuffToUP} ><i name={key} id={ind.toString()} className="fa fa-angle-double-up" aria-hidden="true"></i> 上にコピー</Button>
                                    <Button bsStyle="primary" block style={{"width": "75%", "margin": "10px 12.5%"}} name={key} id={ind.toString()} onClick={copyBuffToDown} ><i name={key} id={ind.toString()} className="fa fa-angle-double-down" aria-hidden="true"></i> 下にコピー</Button>
                                </td>
                            </tr>
                            )
                        }
                    })}
                    <tr>
                        <th className="bg-default" style={{"textAlign": "center"}}><Button onClick={this.switchPersolalBuff}>{intl.translate("個別バフ", locale)}</Button></th>
                        <td colSpan={state.maxTurn + 2}></td>
                    </tr>
                    </tbody>
                </table>
                <SimulationChart data={chartData} sortKey={this.props.sortKey} locale={locale} />
            </div>
        );
    }
});

var BuffListForm = React.createClass({
    render: function() {
        return (
            <FormControl componentClass="select" name={this.props.name} id={this.props.id} value={this.props.value} onChange={this.props.onChange}>
                <optgroup label="通常バフ">{select_normalbuffAmount}</optgroup>
                <optgroup label="属性バフ">{select_elementbuffAmount}</optgroup>
                <optgroup label="その他バフ">{select_otherbuffAmount}</optgroup>
                <optgroup label="DA率">{select_dabuffAmount}</optgroup>
                <optgroup label="TA率">{select_tabuffAmount}</optgroup>
                <optgroup label="奥義ゲージ上昇量">{select_ougigagebuffAmount}</optgroup>
                <optgroup label="追加ダメージ">{select_additionalbuffAmount}</optgroup>
            </FormControl>
        );
    },
});

module.exports = Simulator;
module.exports.BuffListForm = BuffListForm;
