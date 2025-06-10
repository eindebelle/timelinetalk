let g_timer_ids = [];

function Play(){
    Stop();
    let text = document.querySelector( "#speech-text" ).value;
    text.split( /\n/ ).forEach( ( line ) => {
        let [_, minute, seconds, str] = line.match( /(\d+):(\d+)\s+(.*)/ );
        console.log( minute, seconds, str );
        g_timer_ids.push(
            setTimeout( () => {
                    console.log( new Date() );
                    let synthes = new SpeechSynthesisUtterance( str );
                    let select = document.querySelector( "#select-speaker" );
                    let voices = speechSynthesis.getVoices();
                    synthes.voice = voices[select.value];
                    synthes.rate = document.querySelector( "#slider-speed" ).value;
                    synthes.volume = document.querySelector( "#slider-volume" ).value;
                    speechSynthesis.speak( synthes );
                },
                (parseInt(minute) * 60 + parseInt(seconds)) * 1000
            ) );
    } );
}

function Stop(){
    console.log( "Stop." );
    g_timer_ids.forEach( ( id ) => {
        clearTimeout( id );
    } )
    g_timer_ids = [];
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
} );
