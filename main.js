let g_timer_ids = [];
let g_seek_seconds = 0; // シーク位置（秒）
let g_playing = false; // 再生中フラグ
let g_seek_timer = null; // シークバー自動更新用

// テキストをパースして[{time:秒, str:テキスト}]の配列を返す
function parseSpeechLines(text) {
    return text.split(/\n/).map(line => {
        const m = line.match(/(\d+):(\d+)\s+(.*)/);
        if (!m) return null;
        const minute = parseInt(m[1]);
        const seconds = parseInt(m[2]);
        return { time: minute * 60 + seconds, str: m[3] };
    }).filter(Boolean);
}

function formatTime(sec) {
    sec = parseInt(sec);
    return `${Math.floor(sec/60)}:${('0'+(sec%60)).slice(-2)}`;
}

// #offset-time の値（秒）を取得してミリ秒に変換
function getOffsetMs(){
    const offsetSec = parseInt( document.querySelector( "#offset-time" ).value ) || 0;
    return offsetSec * 1000;
}

function setStatus(msg) {
    document.getElementById("status").textContent = msg;
}

function Play(seekSeconds = null){
    Stop();
    setStatus("再生中");
    g_playing = true;
    let text = document.querySelector( "#speech-text" ).value;
    const lines = parseSpeechLines(text);
    const offsetMs = getOffsetMs();
    // シーク位置
    let seek = seekSeconds !== null ? seekSeconds : g_seek_seconds;
    g_seek_seconds = seek;
    // シークバー自動更新開始
    startSeekBarTimer();
    lines.forEach( ({time, str}) => {
        if (time < seek) return; // シーク位置より前はスキップ
        let timeoutMs = (time - seek) * 1000 + offsetMs;
        g_timer_ids.push(
            setTimeout( () => {
                    let synthes = new SpeechSynthesisUtterance( str );
                    let select = document.querySelector( "#select-speaker" );
                    let voices = speechSynthesis.getVoices();
                    synthes.voice = voices[select.value];
                    synthes.rate = document.querySelector( "#slider-speed" ).value;
                    synthes.volume = document.querySelector( "#slider-volume" ).value;
                    speechSynthesis.speak( synthes );
                },
                timeoutMs
            ) );
    });
}

function Stop(){
    g_timer_ids.forEach( ( id ) => {
        clearTimeout( id );
    } )
    g_timer_ids = [];
    setStatus("停止");
    g_playing = false;
    stopSeekBarTimer();
}

// シークバー自動更新
function startSeekBarTimer() {
    stopSeekBarTimer();
    const seekBar = document.getElementById("seek-bar");
    const seekTime = document.getElementById("seek-time");
    const lines = parseSpeechLines(document.getElementById("speech-text").value);
    if (lines.length === 0) return;
    const maxSec = lines[lines.length-1].time;
    const update = () => {
        if (!g_playing) return;
        g_seek_seconds++;
        if (g_seek_seconds > maxSec) {
            g_seek_seconds = maxSec;
            Stop();
            return;
        }
        seekBar.value = g_seek_seconds;
        seekTime.textContent = formatTime(g_seek_seconds);
        g_seek_timer = setTimeout(update, 1000);
    };
    g_seek_timer = setTimeout(update, 1000);
}
function stopSeekBarTimer() {
    if (g_seek_timer) {
        clearTimeout(g_seek_timer);
        g_seek_timer = null;
    }
}

window.addEventListener( "DOMContentLoaded", () => {
    let voices = speechSynthesis.getVoices();
    let select = document.querySelector( "#select-speaker" );
    for( let i = 0; i < voices.length; i++ ){
        let item = document.createElement( 'option' );
        item.setAttribute( 'value', i );
        item.appendChild( document.createTextNode( voices[i].name ) );
        select.appendChild( item );
    }

    document.querySelector( "#btn-play" ).addEventListener( "click", () => {
        Play();
    } );

    document.querySelector( "#btn-stop" ).addEventListener( "click", () => {
        Stop();
    } );

    // シークバーの初期化・更新
    const seekBar = document.getElementById("seek-bar");
    const seekTime = document.getElementById("seek-time");
    const speechText = document.getElementById("speech-text");
    function updateSeekBar() {
        const lines = parseSpeechLines(speechText.value);
        if (lines.length === 0) {
            seekBar.max = 0;
            seekBar.value = 0;
            seekTime.textContent = "0:00";
            return;
        }
        const maxSec = lines[lines.length-1].time;
        seekBar.max = maxSec;
        if (parseInt(seekBar.value) > maxSec) seekBar.value = maxSec;
        seekTime.textContent = formatTime(seekBar.value);
    }
    speechText.addEventListener("input", updateSeekBar);
    seekBar.addEventListener("input", () => {
        seekTime.textContent = formatTime(seekBar.value);
    });
    seekBar.addEventListener("change", () => {
        g_seek_seconds = parseInt(seekBar.value);
        // Play(g_seek_seconds);
    });
    // 再生停止時にシークバーを止める
    document.getElementById("btn-stop").addEventListener("click", stopSeekBarTimer);

    updateSeekBar();
} );
