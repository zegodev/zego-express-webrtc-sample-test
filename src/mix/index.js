import '../common';
import { checkAnRun, logout, publishStreamId, useLocalStreamList, zg, getToken, previewVideo, sei } from '../common';
import { encodeString, getBrowser } from '../assets/utils';
// import flvjs from 'flv.js';
import flvjs from '../assets/flv.min.js';
import { utf8ByteDecode } from '../assets/utils';
import '../assets/gbk';
import '../assets/base64';
import { Base64 } from '../assets/base64';

const taskID = 'task-' + new Date().getTime();
const mixStreamID = 'mixwebrtc-' + new Date().getTime();

function base64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");
  
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
  
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
  
  function uint8arrayToBase64(u8Arr) {
    const CHUNK_SIZE = 0x8000; //arbitrary number
    let index = 0;
    const length = u8Arr.length;
    let result = "";
    let slice;
    while (index < length) {
      slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length));
      result += String.fromCharCode.apply(null, Array.from(slice));
      index += CHUNK_SIZE;
    }
    // web image base64图片格式: "data:image/png;base64," + b64encoded;
    // return  "data:image/png;base64," + btoa(result);
    return btoa(result);
  }

async function updateMix() {
    const streamList = [
        {
            streamID: publishStreamId,
            layout: {
                top: 0,
                left: 0,
                bottom: 240,
                right: 320,
            },
        },
    ];
    if (useLocalStreamList.length !== 0) {
        streamList.push({
            streamID: useLocalStreamList[0].streamID,
            layout: {
                top: 240,
                left: 0,
                bottom: 480,
                right: 320,
            },
        });
    }
    await zg.setMixerTaskConfig({
        backgroundColor: 0x000000
    });
    
    const res = await zg.startMixerTask({
        taskID,
        inputList: streamList,
        outputList: [
            mixStreamID,
            // {
            //     target: mixStreamID,
            //     // target: 'rtmp://test.aliyun.zego.im/livestream/zegodemo',
            // },
        ],
        outputConfig: {
            outputBitrate: 300,
            outputFPS: 15,
            outputWidth: 320,
            outputHeight: 480,
        },
    });

    return res;
}
$(async () => {
    // console.warn('base64', Base64.base64encode('zegozegozegozego'))
    // const str = '%3A%CD%E8%28%CD%E8%28%CD%E8%28%CD%E8%28%7D'.replace(/%/g, '%25')
    // const s = $URL.decode(str)
    // console.warn('s', s)
    await checkAnRun();
    $('');
    
    const mixVideo = $('#mixVideo')[0];
    let hlsUrl;
    let flvPlayer = null;

    let taskID2;
    let mixStreamID2;
    const mixVideo2 = $('#mixVideo2')[0];
    let hlsUrl2;
    let flvPlayer2 = null;
    $('#mixStream').click(async () => {
        try {
            const res = await updateMix();
            if (res.errorCode == 0) {
                $('#stopMixStream').removeAttr('disabled');
                const result = JSON.parse(res.extendedData).mixerOutputList;
                if (
                    navigator.userAgent.indexOf('iPhone') !== -1 &&
                    getBrowser() == 'Safari' &&
                    result &&
                    result[0].hlsURL
                ) {
                    hlsUrl = result[0].hlsURL.replace('http', 'https');
                    mixVideo.src = hlsUrl;
                } else if (result && result[0].flvURL) {
                    const flvUrl = result[0].flvURL.replace('http', 'https');
                    console.log('mixStreamId: ' + mixStreamID);
                    console.log('mixStreamUrl:' + flvUrl);
                    alert('混流开始。。。');
                    if (flvjs.isSupported()) {
                        flvPlayer = flvjs.createPlayer({
                            type: 'flv',
                            url: flvUrl,
                        });
                        flvjs.exportSEI((res) => {
                            const r = utf8ByteDecode(res);
                            // const str ='%D6%D0%B9%FA'
                            // const s = $URL.decode(r.slice(44))
	                        // console.warn('s', s)
                            console.log('获得了SEI信息', new Date(), res, r);
                        })
                        flvPlayer.attachMediaElement(mixVideo);
                        flvPlayer.load();
                    }
                }
                mixVideo.muted = false;
            }

            $('#mixVideo').css('display', '');
        } catch (err) {
            alert('混流失败。。。');
            console.error('err: ', err);
        }
    });

    $('#sendMixSEI').click(async () => {
        const seiInfo = $('#mixSEI').val();
        if (!seiInfo) {
            alert('sei not exist');
            return;
        }
        const u = encodeString(seiInfo)
        zg.setMixerTaskConfig({
            userData: u
        });
        try {
            const res = await updateMix();
            console.warn('sendMixSEI', res)
            if (res.errorCode == 0) {
                
            }
        } catch (err) {
            console.error('err: ', err);
        }
    })
    $('#mixStreamOnlyAudio').click(async () => {
        try {
            const streamList = [
                {
                    streamID: publishStreamId,
                    contentType: 'AUDIO',
                },
            ];
            if (useLocalStreamList.length !== 0) {
                streamList.push({
                    streamID: useLocalStreamList[0].streamID,
                    contentType: 'AUDIO',
                });
            }
            taskID2 = 'task-' + new Date().getTime();
            mixStreamID2 = 'mixwebrtc-' + new Date().getTime();
            
            const res = await zg.startMixerTask({
                taskID: taskID2,
                inputList: streamList,
                outputList: [
                    mixStreamID2,
                    // {
                    //     target: mixStreamID,
                    //     // target: 'rtmp://test.aliyun.zego.im/livestream/zegodemo',
                    // },
                ],
                // outputConfig: {
                //     outputBitrate: 1,
                //     outputFPS: 1,
                //     outputWidth: 10,
                //     outputHeight: 10,
                // },
            });
            if (res.errorCode == 0) {
                $('#stopMixStream2').removeAttr('disabled');
                const result = JSON.parse(res.extendedData).mixerOutputList;
                if (
                    navigator.userAgent.indexOf('iPhone') !== -1 &&
                    getBrowser() == 'Safari' &&
                    result &&
                    result[0].hlsURL
                ) {
                    hlsUrl2 = result[0].hlsURL.replace('http', 'https');
                    mixVideo2.src = hlsUrl2;
                } else if (result && result[0].flvURL) {
                    const flvUrl = result[0].flvURL.replace('http', 'https');
                    console.log('mixStreamId: ' + mixStreamID);
                    console.log('mixStreamUrl:' + flvUrl);
                    alert('混流开始。。。');
                    if (flvjs.isSupported()) {
                        flvPlayer2 = flvjs.createPlayer({
                            type: 'flv',
                            url: flvUrl,
                            hasVideo: false
                        });
                        flvPlayer2.attachMediaElement(mixVideo2);
                        flvPlayer2.load();
                    }
                }
                mixVideo2.muted = false;
            }

            $('#mixVideo2').css('display', '');
        } catch (err) {
            alert('混流失败。。。');
            console.error('err: ', err);
        }
    });
    $('#stopMixStream').click(async () => {
        try {
            await zg.stopMixerTask(taskID);
            alert('停止混流成功。。。');
            if (flvPlayer) {
                flvPlayer.destroy();
                flvPlayer = null;
            }
            console.log('stopMixStream success: ');
            $('#stopMixStream').attr('disabled', 'disabled');
            $('#mixVideo').css('display', 'none');
        } catch (err) {
            alert('停止混流失败。。。');
            console.log('stopMixStream err: ', err);
        }
    });
    $('#stopMixStream2').click(async () => {
        try {
            await zg.stopMixerTask(taskID2);
            alert('停止混流成功。。。');
            if (flvPlayer2) {
                flvPlayer2.destroy();
                flvPlayer2 = null;
            }
            console.log('stopMixStream success: ');
            $('#stopMixStream2').attr('disabled', 'disabled');
            $('#mixVideo2').css('display', 'none');
        } catch (err) {
            alert('停止混流失败。。。');
            console.log('stopMixStream err: ', err);
        }
    });

    $('#leaveRoom').unbind('click');
    $('#leaveRoom').click(function () {
        if (flvPlayer) {
            flvPlayer.destroy();
            flvPlayer = null;
        }
        mixVideo.src = '';
        $('#mixVideo').css('display', 'none');
        if (flvPlayer2) {
            flvPlayer2.destroy();
            flvPlayer2 = null;
        }
        mixVideo2.src = '';
        $('#mixVideo2').css('display', 'none');

        logout();
    });
    $("#customMixerConfig").val(
        `
{
    "taskID": "custom-task",
    "inputList": [
        {
            "streamID": "${publishStreamId}",
            "layout": { 
                "top": 0, 
                "left": 0, 
                "bottom": 200, 
                "right": 200 
            }
        }
    ],
    "outputList": [
        "custom-mix-output"
    ],
    "outputConfig": {
        "outputBitrate": 300,
        "outputFPS": 15,
        "outputWidth": 400,
        "outputHeight": 400
    }
}
        `
    )
    $("#startCustomMixerTask").click(async () => {
        const str = $("#customMixerConfig").val()
        let config = {}
        try {
            config = JSON.parse(str)
        } catch (error) {
            alert("json format error")
            throw error
        }
        const res = await zg.startMixerTask(config)
        if (res.errorCode == 0) {
            const result = JSON.parse((res.extendedData).toString())
                .mixerOutputList;
            let flvUrl = result[0].flvURL;
            flvUrl = flvUrl.replace("http", "https");
            console.warn("mixStreamUrl:" + flvUrl);
            if (flvjs.isSupported()) {
                try {
                    flvPlayer = flvjs.createPlayer({
                        type: 'flv',
                        url: flvUrl,
                    }, {
                        ENABLE_ERROR: false,
                        ENABLE_INFO: false,
                        ENABLE_WARN: false,
                        ENABLE_DEBUG: false
                    });
                    flvPlayer.attachMediaElement(mixVideo);
                    flvPlayer.load();
                } catch (error) {
                    
                }
                $('#mixVideo').css('display', '');
            }
        }
    })
    $("#renewToken").click(async () => {
        const roomID = $("#roomId").val();
        const _expireTime = document.querySelector("#expireTime").value;
        const expireTime = parseInt(_expireTime);
        const userID = $("#userID").val();
        const token = await getToken(userID, roomID, expireTime);
        $("#custom-token").val(token);
        zg.renewToken(token, roomID);
    });
    $('#publish').click(() => {
        const publishStreamID = publishStreamId || 'web-' + new Date().getTime();
        const result = zg.startPublishingStream(publishStreamID,  previewVideo.srcObject, { roomID: $('#roomId').val(), isSEIStart: sei });
        console.log('publish stream' + publishStreamID, result);
    });
});
