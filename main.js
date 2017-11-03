var recorder;
var audio_context;
var wavesurfer_me;
var wavesurfer_demo;
var duration;
var recorded = false;
var blob_url;
var paused = false;
var query = getQueryVariable();
var user_id = query['u'];
var task_prog = Number(query['p']);
var task_name = query['t'];
var q_num = Number(query['n']);
var num_of_files;
var order_index;
var order_ary;

order_ary = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10"];
if (Number(user_id.slice(1))%2==1) {
        var set_id = "set_1";
    }else{
        var set_id = "set_2";
    }

var FileURL = 'wav/' + set_id + '/' + task_name + '/num_of_files';
$.ajax({
      url: FileURL,
      type: 'get',
      dataType: 'text'
    })
    .done(function(res) {
      num_of_files = res;
    })
    .fail(function(jqXHR, statusText, errorThrown) {
    });


// 開始処理
$(function(){
    initializeWaveforms();
    $('#start').click(function(e) { startRecordingButtonClicked(e); return false; });
    $('#stop-button').click(function(e) {stopRecording(e); return false; });
    $('#play-button').click(function(e) { startPlayButtonClicked(e); return false; });
    $('#pause-button').click(function(e) { pauseButtonClicked(e); return false; });
    $('#submit-button').click(function(e) { submitButtonClicked(e); return false; });
    $('#progress-now').html(String(q_num));
    $("#progress-all").load(FileURL);
    $('#task-progress-now').html(String(task_prog));
    $("#task-progress-all").html(order_ary.length);
});

// 波形処理
function initializeWaveforms() {
    
    $('#waveform-demo').empty();
    wavesurfer_demo = WaveSurfer.create({
        container: '#waveform-demo',
        scrollParent: true,
        interact: false,
        waveColor: 'lightsteelblue',
        progressColor: 'cornflowerblue',
        cursorWidth: 1,
        cursorColor: 'midnightblue'
    });

    wavesurfer_demo.load("./wav/" + set_id + "/"+ task_name + "/" + task_name + "_" + q_num + ".wav");

    // オリジナル波形準備完了処理
    wavesurfer_demo.on('ready', function (e) {
        $('#start-button').attr('disabled', false);
        duration = wavesurfer_demo.getDuration();
        $('#time').text(timeToStr(0) + ' / ' + timeToStr(duration));
    });

    wavesurfer_demo.on('audioprocess', function (e) {
        $('#time').text(timeToStr(wavesurfer_demo.getCurrentTime()) + ' / ' + timeToStr(duration));
    });

    wavesurfer_demo.on('finish', function (e) {
        if (!recorded) stopRecording();
        wavesurfer_demo.seekTo(0);       
    });

    // 自分波形処理
    $('#waveform').empty();
    wavesurfer_me = WaveSurfer.create({
        container: '#waveform',
        scrollParent: true,
        interact: false,
        waveColor: 'lightsteelblue',
        progressColor: 'cornflowerblue',
        cursorWidth: 1,
        cursorColor: 'midnightblue'
    });
    panner_demo = wavesurfer_demo.backend.ac.createPanner();
    panner_me = wavesurfer_me.backend.ac.createPanner();
    setPanner(panner_demo, 0);
    setPanner(panner_me, 0);
    wavesurfer_demo.backend.setFilter(panner_demo);
    wavesurfer_me.backend.setFilter(panner_me);
  }

function setPanner(panner, pan) {
    var dir = pan * Math.PI / 2;
    panner.panningModel = "equalpower";
    panner.setPosition(Math.sin(dir), 0, -Math.cos(dir));
}

// 録音開始ボタン
function startRecordingButtonClicked(e) {
    recorded = false;
    initializeRecording();
}

// 録音イニシャライズ系処理
function initializeRecording() {
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
        window.URL = window.URL || window.webkitURL;
        if (!audio_context) {
            audio_context = new AudioContext;
        }
        //$('#srate').text('[' + audio_context.sampleRate + ' Hz]');
        navigator.getUserMedia(
            {audio: { "mandatory": {
                "googEchoCancellation": false,
                "googAutoGainControl": false,
                "googNoiseSuppression": false,
                "googHighpassFilter": false }, "optional": []}},
            function(stream) { startRecording(stream); },
            function(e) { showError(e, 4); });
    } catch (e) {
        showError(e, 7);
    }
}

// エラー表示処理
function showError(e, code) {
    alert('Error No.' + code + ': ' + e);
    console.log(e);
}

function startRecording(stream) {
    if (recorded) return;
    recorder = new Recorder(audio_context.createMediaStreamSource(stream), {numChannels: 1});
    recorder && recorder.record();
    if (wavesurfer_me.isPlaying()) {
        wavesurfer_me.stop();
    }
    wavesurfer_me.empty();
    wavesurfer_demo.setVolume(1);
    wavesurfer_demo.seekTo(0);
    wavesurfer_demo.play();
    $('#controllers2 input').attr('disabled', true);
    $('#start').attr('disabled', true);
    $('#stop-button').attr('disabled', false);
    $('#play-button').attr('disabled', true);
    $('#submit-button').attr('disabled', true);
    getTimeStamp()
}

// 録音終了処理
function stopRecording() {
    recorder && recorder.stop();

    // エクスポート完了処理
    recorder && recorder.exportWAV(function(blob) {
        blob_url = URL.createObjectURL(blob, {'type': 'audio/wav'});
        wavesurfer_me.load(blob_url);
        $('#waveform-demo-container').css('visibility', 'visible');
        $('#waveform-container').css('visibility', 'visible');
        $('#play-button').attr('disabled', false);
        recorded = true;
        var fd = new FormData();
        var filename = user_id + '_' + task_name + '_' + q_num + '.wav';
        fd.append("upfile", blob, filename);
        var user_id_blob = new Blob([user_id], { type: "text/xml"});
        fd.append("user_id", user_id_blob, user_id);
        var task_name_blob = new Blob([task_name], { type: "text/xml"});
        fd.append("task_name", task_name_blob, task_name);

        $.ajax({
          type: 'POST',
          url: 'upload.php',
          data: fd,
          processData: false,
          contentType: false
        }).done(function(data) {
       console.log(data);
       submitButtonClicked();
       });
    });

    recorder && recorder.clear();
    $('#stop-button').attr('disabled', true);
    $('#start-button').attr('value', 'Record');
    $('#download-button').attr('disabled', false);
    if (q_num == num_of_files) {
      if (String(task_prog) == order_ary.length){
        $('#submit-button').attr('value', 'Finish');
      }else{
        $('#submit-button').attr('value', 'To the next task');
      }
    }
    wavesurfer_me.on('ready', function (e) {
        duration = wavesurfer_me.getDuration();
        $('#time').text(timeToStr(0) + ' / ' + timeToStr(duration));
    });
}

// 同時再生ボタン
function startPlayButtonClicked(e) {
    if (!recorded) return;
    setPanner(panner_demo, -1);
    setPanner(panner_me, 1);
    $('#start').attr('disabled', true); 
    wavesurfer_me.setVolume(1);
    wavesurfer_demo.setVolume(1);
    play();
}

function play() {
    wavesurfer_me.seekTo(0);
    wavesurfer_demo.seekTo(0);
    wavesurfer_me.play();
    wavesurfer_demo.play();
    paused = false;
    wavesurfer_me.on('audioprocess', function (e) {
        $('#time').text(timeToStr(wavesurfer_me.getCurrentTime()) + ' / ' + timeToStr(duration));
    });
    wavesurfer_me.on('finish', function (e) {
        wavesurfer_me.seekTo(0);
    });
    wavesurfer_demo.on('finish', function (e) {
        wavesurfer_demo.seekTo(0);
        setPanner(panner_demo, 0);
    });
}

// 一時停止ボタン
function pauseButtonClicked(e) {
    if (!recorded) return;
    if (paused) {
        wavesurfer_me.play();
        paused = false;
        $('#pause-button').attr('value', 'Pause');
    } else {
        wavesurfer_me.pause();
        paused = true;
        $('#pause-button').attr('value', 'Resume');
    }
}

// ダウンロードボタン
function downloadButtonClicked(e) {
    //if (!recorded) return;
    var a = document.createElement('a');
    a.download = 'record' + getTimeStamp() + '.wav';
    a.href = blob_url;
    a.click();
}

// 送信ボタン
function submitButtonClicked(e) {
    if (!recorded) return;

    var fd = new FormData();
    var user_id_blob = new Blob([user_id], { type: "text/xml"});
    fd.append("user_id", user_id_blob, user_id);
    var task_name_blob = new Blob([task_name], { type: "text/xml"});
    fd.append("task_name", task_name_blob, task_name);
    var task_prog_blob = new Blob([task_prog], { type: "text/xml"});
    fd.append("task_prog", task_prog_blob, task_prog);
    var last_slide_blob = new Blob([String(q_num+1)], { type: "text/xml"});
    fd.append("last_slide", last_slide_blob, String(q_num));
    $.ajax({
        type: 'POST',
        url: 'last_slide_update.php',
        data: fd,
        processData: false,
        contentType: false
      }).done(function(data) {
     });

    if (q_num == num_of_files) {
        var fd = new FormData();
        var user_id_blob = new Blob([user_id], { type: "text/xml"});
        fd.append("user_id", user_id_blob, user_id);
        var task_name_blob = new Blob([task_name], { type: "text/xml"});
        fd.append("task_name", task_name_blob, task_name);
        var task_prog_blob = new Blob([task_prog], { type: "text/xml"});
        fd.append("task_prog", task_prog_blob, task_prog);
        $.ajax({
          type: 'POST',
          url: 'prog_update.php',
          data: fd,
          processData: false,
          contentType: false
        }).done(function(data) {
       console.log(data);
       });

      q_num = 1;

     var fd = new FormData();
     var user_id_blob = new Blob([user_id], { type: "text/xml"});
     fd.append("user_id", user_id_blob, user_id);
     var last_slide_blob = new Blob([String(q_num-1)], { type: "text/xml"});
     fd.append("last_slide", last_slide_blob, String(q_num-1));
     $.ajax({
        type: 'POST',
        url: 'last_slide_update.php',
        data: fd,
        processData: false,
        contentType: false
      }).done(function(data) {
     });

     task_name = order_ary[task_prog];
     if (String(task_prog) == order_ary.length){
       var URL = 'https://www.gavo.t.u-tokyo.ac.jp/~inoue0124/native-shadowing/finish.php';
       window.location.href = URL;
        }
        task_prog += 1;
    } else {
        q_num += 1;
    }
    if (task_prog != Number(order_ary.length)+1) {
    var URL = 'https://www.gavo.t.u-tokyo.ac.jp/~inoue0124/native-shadowing/main.php?u=' + user_id + '&p=' + String(task_prog) + '&t=' + task_name + '&n=' + String(q_num);
    window.location.href = URL;
 }
}

// 時刻変換
function timeToStr(sec) {
    if (sec < 10) {
        return '0:0' + Math.floor(sec);
    } else if (sec < 60) {
        return '0:' + Math.floor(sec);
    } else {
        var min = Math.floor(sec / 60);
        var realsec = Math.floor(sec - 60 * min);
        if (realsec < 10) {
            return min + ':0' + realsec;
        } else {
            return min + ':' + realsec;
        }

    }
}

// タイムスタンプの生成
function getTimeStamp() {
    var date = new Date();
    return date.getFullYear() +
        ('0' + (date.getMonth() + 1)).slice(-2) +
        ('0' + date.getDate()).slice(-2) +
        ('0' + date.getHours()).slice(-2) +
        ('0' + date.getMinutes()).slice(-2) +
        ('0' + date.getSeconds()).slice(-2);
}

// クエリを取得する
function getQueryVariable() {
    var urlParams;
    var match,
        pl     = /\+/g,
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    urlParams = {};
    while (match = search.exec(query))
        urlParams[decode(match[1])] = decode(match[2]);
    return urlParams;
}

function wait(sec) {
        var objDef = new $.Deferred;
        setTimeout(function () {
            objDef.resolve(sec);
        }, sec*1000);
        return objDef.promise();
 
    };
