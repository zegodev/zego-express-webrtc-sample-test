/* eslint-disable @typescript-eslint/no-use-before-define */
import VConsole from 'vconsole';
import './assets/bootstrap.min';
import './assets/bootstrap.min.css';
import { ZegoExpressEngine } from 'zego-express-engine-webrtc';
import { getCgi } from './content';
import { getBrowser, decodeString, encodeString } from './assets/utils';

new VConsole();
const userName = 'sampleUser' + new Date().getTime();
const tokenUrl = 'https://wsliveroom-alpha.zego.im:8282/token';
let userID = 'sample' + new Date().getTime();
$("#custom-userid").text(userID)
let publishStreamId = 'webrtc' + new Date().getTime();
let zg;
let appID = 1739272706; // 请从官网控制台获取对应的appID
let server = 'wss://webliveroom1739272706-api.zego.im/ws';  // 请从官网控制台获取对应的server地址，否则可能登录失败

let cgiToken = '';
//const appSign = '';
let previewVideo;
let useLocalStreamList = [];
let effectPlayer = null
let isPreviewed = false;
let supportScreenSharing = false;
let loginRoom = false;
let logouted = true;

let localStreamMap = {}
let publishType;

let l3;
let roomList = [];
let playQualityList = {};
let accessDomain;
let isAccess;
let auth;
let ver;

window.publishTimes = {};
window.playTimes = {};
let sei;
let seiUUID;

let publishTimes = {};

let completeStreamID;
let sendSEIFPS = 0;
let sendSEITimer;
let _seiUUID = '4fb6482e-9c68-66';
// 测试用代码，开发者请忽略
// Test code, developers please ignore

({ appID, server, cgiToken, userID, l3, accessDomain, isAccess, auth, ver, sei, seiUUID } = getCgi(appID, server, cgiToken));

if (userID == "") {
    userID = 'sample' + new Date().getTime();
    // $("#custom-userid").text(userID)
}

console.warn('accessDomain', accessDomain)
// if (!accessDomain) {
//     accessDomain = ['access-wss-beta.zego.im']
// }
if (seiUUID.length === 16) {
    _seiUUID = seiUUID
}


$("#custom-userid").text(userID)

if (cgiToken && tokenUrl == 'https://wsliveroom-alpha.zego.im:8282/token') {
    $.get(cgiToken, rsp => {
        cgiToken = rsp.data;
        console.log(cgiToken);
    });
}

// 测试用代码 end
// Test code end

let browser = {
    versions: function () {
        var u = navigator.userAgent, app = navigator.appVersion;
        return {
            trident: u.indexOf('Trident') > -1, //IE内核
            presto: u.indexOf('Presto') > -1, //opera内核
            webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
            gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1,//火狐内核
            mobile: !!u.match(/AppleWebKit.*Mobile.*/), //是否为移动终端
            ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
            android: u.indexOf('Android') > -1 || u.indexOf('Adr') > -1, //android终端
            iPhone: u.indexOf('iPhone') > -1, //是否为iPhone或者QQHD浏览器
            iPad: u.indexOf('iPad') > -1, //是否iPad
            webApp: u.indexOf('Safari') == -1, //是否web应用程序，没有头部与底部
            weixin: u.indexOf('MicroMessenger') > -1, //是否微信 （2015-01-22新增）
            qq: u.match(/\sQQ/i) == " qq" //是否QQ
        };
    }(),
    language: (navigator.browserLanguage || navigator.language).toLowerCase()
}


// eslint-disable-next-line prefer-const
zg = new ZegoExpressEngine(appID, server, { accessDomains: accessDomain });


console.error('isAccessd', isAccess)
if (isAccess === false) {
    zg.zegoWebRTM.stateCenter.useNetAgent = false;
    zg.zegoWebRTC.stateCenter.useNetAgent = false;
}

window.zg = zg;
window.useLocalStreamList = useLocalStreamList;
if (zg.getVersion() > "2.15.0") {
    zg.setSEIConfig({
        unregisterSEIFilter: _seiUUID
    });
}
async function checkAnRun(checkScreen) {
    console.log('sdk version is', zg.getVersion());
    try {
        const result = await zg.checkSystemRequirements();

        console.warn('checkSystemRequirements ', result);
        !result.videoCodec.H264 && $('#videoCodeType option:eq(1)').attr('disabled', 'disabled');
        !result.videoCodec.VP8 && $('#videoCodeType option:eq(2)').attr('disabled', 'disabled');

        if (!result.webRTC) {
            alert('browser is not support webrtc!!');
            return false;
        } else if (!result.videoCodec.H264 && !result.videoCodec.VP8) {
            alert('browser is not support H264 and VP8');
            return false;
        } else if (result.videoCodec.H264) {
            supportScreenSharing = result.screenSharing;
            if (checkScreen && !supportScreenSharing) alert('browser is not support screenSharing');
            previewVideo = $('#previewVideo')[0];
            start();
        } else {
            alert('不支持H264，请前往混流转码测试');
        }

        return true;
    } catch (err) {
        console.error('checkSystemRequirements', err);
        return false;
    }


}

async function start() {
    initSDK();

    zg.setLogConfig({
        logLevel: 'debug',
        remoteLogLevel: 'info',
        logURL: '',
    });

    zg.setDebugVerbose(false);
    // zg.setSoundLevelDelegate(true, 3000);

    $('#createRoom').click(async () => {
        let loginSuc = false;
        try {
            // loginTime = new Date().getTime();
            loginSuc = await enterRoom();

            loginSuc && (await publish());
            // const publishConsumed = new Date().getTime() - loginTime;
            // console.warn('推流 ' + publishConsumed);
        } catch (error) {
            console.error(error);
        }
    });

    $('#openRoom').click(async () => {
        await enterRoom();
    });

    $('#leaveRoom').click(function () {
        logout();
    });

    $('#stopPlaySound').click(() => {
        zg.setSoundLevelDelegate(false);
    });

    $('#resumePlaySound').click(() => {
        zg.setSoundLevelDelegate(false);
        zg.setSoundLevelDelegate(true);
    });
    $('#sendSEI').click(() => {
        const seiInfo = $('#seiInfo').val();
        if (!seiInfo) {
            alert('未填写SEI');
            return;
        }
        let _seiInfo = seiInfo;
        const seiType = $('#seiType').val();
        if (seiType === '1') {
            _seiInfo = _seiUUID + seiInfo
        }
        const seiArray = encodeString(_seiInfo);
        $('#seibytelen').text('' + seiArray.byteLength)
        const res = zg.sendSEI(publishStreamId, seiArray);
        if (res) {
            console.warn('发送 SEI ', seiInfo)
        }
    });
    $('#sendSEIInterval').click(() => {
        const seiInfo = $('#seiInfo').val();
        if (!seiInfo) {
            alert('未填写SEI');
            return;
        }
        if (!sendSEIFPS) {
            console.error('no send fps')
            return;
        }
        let _seiInfo = seiInfo;
        const seiType = $('#seiType').val();
        if (seiType === '1') {
            _seiInfo = _seiUUID + seiInfo
        }
        const seiArray = encodeString(_seiInfo);
        $('#seibytelen').text('' + seiArray.byteLength)
        sendSEITimer = setInterval(() => {
            zg.sendSEI(publishStreamId, seiArray);
        }, 1000 / sendSEIFPS);
    })
}

async function enumDevices() {
    const audioInputList = [],
        videoInputList = [];
    const deviceInfo = await zg.enumDevices();

    deviceInfo &&
        deviceInfo.microphones.map((item, index) => {
            if (!item.deviceName) {
                item.deviceName = 'microphone' + index;
            }
            audioInputList.push(' <option value="' + item.deviceID + '">' + item.deviceName + '</option>');
            console.log('microphone: ' + item.deviceName);
            return item;
        });

    deviceInfo &&
        deviceInfo.cameras.map((item, index) => {
            if (!item.deviceName) {
                item.deviceName = 'camera' + index;
            }
            videoInputList.push(' <option value="' + item.deviceID + '">' + item.deviceName + '</option>');
            console.log('camera: ' + item.deviceName);
            return item;
        });
    deviceInfo &&
        deviceInfo.speakers.map((item, index) => {
            if (!item.deviceName) {
                item.deviceName = 'speaker' + index;
            }
            videoInputList.push(' <option value="' + item.deviceID + '">' + item.deviceName + '</option>');
            console.log('speaker: ' + item.deviceName);
            return item;
        });

    audioInputList.push('<option value="0">禁止</option>');
    videoInputList.push('<option value="0">禁止</option>');

    $('#audioList').html(audioInputList.join(''));
    $('#videoList').html(videoInputList.join(''));
    $('#speakerList').html(videoInputList.join(''));
}

function initSDK() {
    enumDevices();

    zg.on('roomStateUpdate', (roomID, state, errorCode, extendedData) => {
        $("#roomState").text(state)
    });
    zg.on('roomStateChanged', (roomID, state, errorCode, extendedData) => {
        console.warn('roomStateChanged: ', roomID, state, errorCode, extendedData);
        $("#roomState").text(state)
    });
    zg.on('roomUserUpdate', (roomID, updateType, userList) => {
        console.warn(
            `roomUserUpdate: room ${roomID}, user ${updateType === 'ADD' ? 'added' : 'left'} `,
            JSON.stringify(userList),
        );
    });
    zg.on('publisherStateUpdate', result => {
        console.warn('publisherStateUpdate: ', result.streamID, result.state, result);
        $("#streamState").text(result.state)
        if (result.state == 'PUBLISHING') {
            console.info(' publish  success ' + result.streamID);
            const now = new Date().getTime();
            const pushConsumed = now - window.publishTime;
            console.warn("推流耗时 " + pushConsumed);

            const publishConsumed = now - window.loginTime;
            console.warn('登录推流耗时 ' + publishConsumed);

            if (window.publishTimes[result.streamID]) {
                const publishRetryConsumed = now - window.publishTimes[result.streamID];
                console.warn('推流节点耗时 ' + publishRetryConsumed)
                delete window.publishTimes[result.streamID];;
            }

        } else if (result.state == 'PUBLISH_REQUESTING') {
            console.info(' publish  retry');
            if (result.errorCode !== 0 && !window.publishTimes[result.streamID]) {
                window.publishTimes[result.streamID] = new Date().getTime();
            }
        } else {
            delete window.publishTimes[result.streamID];
            if (result.errorCode == 0) {
                console.warn('publish stop ' + result.errorCode + ' ' + result.extendedData);
            } else {
                console.error('publish error ' + result.errorCode + ' ' + result.extendedData);
            }
            // const _msg = stateInfo.error.msg;
            // if (stateInfo.error.msg.indexOf ('server session closed, reason: ') > -1) {
            //         const code = stateInfo.error.msg.replace ('server session closed, reason: ', '');
            //         if (code === '21') {
            //                 _msg = '音频编解码不支持(opus)';
            //         } else if (code === '22') {
            //                 _msg = '视频编解码不支持(H264)'
            //         } else if (code === '20') {
            //                 _msg = 'sdp 解释错误';
            //         }
            // }
            // alert('推流失败,reason = ' + _msg);
        }
    });
    zg.on('playerStateUpdate', result => {
        console.warn('playerStateUpdate', result.streamID, result.state);
        if (result.state == 'PLAYING') {
            console.info(' play  success ' + result.streamID);
            const now = new Date().getTime();

            if (window.playTimes[result.streamID]) {
                const playRetryConsumed = now - window.playTimes[result.streamID];
                console.warn('拉流节点耗时 ' + playRetryConsumed)
                delete window.playTimes[result.streamID];;
            }
            const browser = getBrowser();
            console.warn('browser', browser);
            if (browser === 'Safari') {
                const videos = $('.remoteVideo video');
                for (let i = 0; i < videos.length; i++) {
                    videos[i].srcObject = videos[i].srcObject;
                }
            }
        } else if (result.state == 'PLAY_REQUESTING') {
            console.info(' play  retry');
            if (result.errorCode !== 0 && !window.playTimes[result.streamID]) {
                window.playTimes[result.streamID] = new Date().getTime();
            }
        } else {
            delete window.playTimes[result.streamID];
            if (result.errorCode == 0) {
                console.warn('play stop ' + result.errorCode + ' ' + result.extendedData);
            } else {
                console.error('play error ' + result.errorCode + ' ' + result.extendedData);
            }

            // const _msg = stateInfo.error.msg;
            // if (stateInfo.error.msg.indexOf ('server session closed, reason: ') > -1) {
            //         const code = stateInfo.error.msg.replace ('server session closed, reason: ', '');
            //         if (code === '21') {
            //                 _msg = '音频编解码不支持(opus)';
            //         } else if (code === '22') {
            //                 _msg = '视频编解码不支持(H264)'
            //         } else if (code === '20') {
            //                 _msg = 'sdp 解释错误';
            //         }
            // }
            // alert('拉流失败,reason = ' + _msg);
        }
    });
    zg.on('streamExtraInfoUpdate', (roomID, streamList) => {
        console.warn(`streamExtraInfoUpdate: room ${roomID},  `, JSON.stringify(streamList));
    });
    zg.on('roomStreamUpdate', async (roomID, updateType, streamList, extendedData) => {
        console.warn('roomStreamUpdate 1 roomID ', roomID, streamList, extendedData);
        // let queue = []
        $("#roomState").innerText = updateType
        if (updateType == 'ADD') {
            for (let i = 0; i < streamList.length; i++) {
                console.info(streamList[i].streamID + ' was added');
                let remoteStream;
                let playOption = {};

                if ($("#videoCodec").val()) playOption.videoCodec = $("#videoCodec").val();
                if (l3 == true) playOption.resourceMode = 2;
                playOption.isSEIStart = sei;
                zg.startPlayingStream(streamList[i].streamID, playOption).then(stream => {
                    remoteStream = stream;
                    useLocalStreamList.push(streamList[i]);


                    if (zg.getVersion() >= "2.17.0") {
                        const id = streamList[i].streamID
                        $(".remoteVideo").append(
                            $(`
                            <div class="view-wrapper" id="wrap${id}" style="display:inline-block;width: 240px; border: 1px solid #dfdfdf; font-size: 12px;">
                              <div id="${id}"  style="min-width: 240px;width: 240px; height: 180px;"></div>
                              <div id="local-action">
                                <button id="local-ctrl-audio${id}">开关声音</button>
                                <button id="local-ctrl-video${id}">开关视频</button>
                                <button id="local-ctrl-resume${id}">恢复</button>
                                <button id="local-ctrl-play${id}">挂载</button>
                                <button id="local-ctrl-stop${id}">卸载</button>
                                <input id="local-ctrl-volume${id}" type="range" min="0" max="100" value="100" id="audioVolume1">
                                <span id="local-ctrl-audio-state${id}"></span>
                                <span id="local-ctrl-video-state${id}"></span>
                              </div>
                            </div>`
                            )
                        );
                        const viewer = zg.createRemoteStreamView(stream);
                        bindViewCtrl(viewer, id);
                        console.warn('enable-dialog', $("#enable-dialog").val() != "0");
                        viewer.play(id, { enableAutoplayDialog: $("#enable-dialog").val() != "0" });
                    } else {
                        let videoTemp = $(`<video id=${streamList[i].streamID} autoplay muted playsinline controls></video>`)
                        //queue.push(videoTemp)
                        $('.remoteVideo').append(videoTemp);
                        const video = $('.remoteVideo video:last')[0];
                        console.warn('video', video, remoteStream);
                        video.srcObject = remoteStream;
                        video.muted = false;
                    }

                    // videoTemp = null;
                }).catch(err => {
                    console.error('err', err);
                });

            }
            // const inIphone = browser.versions.mobile && browser.versions.ios
            // const inSafari = browser.versions.webApp
            // const inWx = browser.versions.weixin
            // if(streamList.length > 1 && (inIphone || inSafari || inWx)) {
            //     const ac = zc.zegoWebRTC.ac;
            //     ac.resume();
            //     const gain = ac.createGain();

            //     while(queue.length) {
            //         let temp = queue.shift()
            //         if(temp.srcObject) {
            //             queue.push(ac.createMediaStreamSource(temp.srcObject))
            //         } else {
            //             temp.connect(gain)
            //         }
            //     }
            //     gain.connect(ac.destination);
            // }
        } else if (updateType == 'DELETE') {
            for (let k = 0; k < useLocalStreamList.length; k++) {
                for (let j = 0; j < streamList.length; j++) {
                    if (useLocalStreamList[k].streamID === streamList[j].streamID) {
                        try {
                            zg.stopPlayingStream(useLocalStreamList[k].streamID);
                        } catch (error) {
                            console.error(error);
                        }

                        console.info(useLocalStreamList[k].streamID + ' was removed');
                        if (zg.getVersion() >= "2.17.0") {
                            const a = document.querySelector(`#wrap${useLocalStreamList[k].streamID}`)

                            $(`#wrap${useLocalStreamList[k].streamID}`).remove();
                        } else {
                            $('.remoteVideo video:eq(' + k + ')').remove();
                        }
                        useLocalStreamList.splice(k--, 1);
                        break;
                    }
                }
            }
        }
    });

    zg.on('playQualityUpdate', async (streamID, streamQuality) => {
        console.log(
            `play#${streamID} videoFPS: ${streamQuality.video.videoFPS} videoBitrate: ${streamQuality.video.videoBitrate} audioBitrate: ${streamQuality.audio.audioBitrate} audioFPS: ${streamQuality.audio.audioFPS}`,
        );
        if (playQualityList[streamID]) {
            playQualityList[streamID].qualityCount++;
            const totalVideoBitrate = playQualityList[streamID].totalVideoBitrate + streamQuality.video.videoBitrate;
            const averVideoBitrate = totalVideoBitrate / playQualityList[streamID].qualityCount;
            const totalVideoFPS = playQualityList[streamID].totalVideoFPS + streamQuality.video.videoFPS;
            const averVideoFPS = totalVideoFPS / playQualityList[streamID].qualityCount;

            playQualityList[streamID].totalVideoBitrate = totalVideoBitrate;
            playQualityList[streamID].averVideoBitrate = averVideoBitrate;
            playQualityList[streamID].totalVideoFPS = totalVideoFPS;
            playQualityList[streamID].averVideoFPS = averVideoFPS;
        } else {
            playQualityList[streamID] = {
                qualityCount: 1,
                totalVideoBitrate: 0,
                averVideoBitrate: 0,
                totalVideoFPS: 0,
                averVideoFPS: 0,
            }

            playQualityList[streamID].totalVideoBitrate = streamQuality.video.videoBitrate;
            playQualityList[streamID].averVideoBitrate = streamQuality.video.videoBitrate;
            playQualityList[streamID].totalVideoFPS = streamQuality.video.videoFPS;
            playQualityList[streamID].averVideoFPS = streamQuality.video.videoFPS;
        }

        console.warn("当前视频码率平均值：" + playQualityList[streamID].averVideoBitrate);
        console.warn("当前视频帧率平均值：" + playQualityList[streamID].averVideoFPS);
        console.log(`play#${streamID}`, streamQuality);
    });

    zg.on('publishQualityUpdate', async (streamID, streamQuality) => {
        console.log(
            `publish#${streamID} videoFPS: ${streamQuality.video.videoFPS} videoBitrate: ${streamQuality.video.videoBitrate} audioBitrate: ${streamQuality.audio.audioBitrate} audioFPS: ${streamQuality.audio.audioFPS}`,
        );
        console.log(`publish#${streamID}`, streamQuality);
    });

    zg.on('remoteCameraStatusUpdate', (streamID, status) => {
        // if (!streamID.includes('webrtc')) return;
        console.warn(`remoteCameraStatusUpdate ${streamID} camera status ${status == 'OPEN' ? 'open' : 'close'}`);
    });

    zg.on('remoteMicStatusUpdate', (streamID, status) => {
        // if (!streamID.includes('webrtc')) return;
        console.warn(`remoteMicStatusUpdate ${streamID} micro status ${status == 'OPEN' ? 'open' : 'close'}`);
    });

    zg.on('soundLevelUpdate', (streamList) => {
        streamList.forEach(stream => {
            stream.type == 'push' && $('#soundLevel').html(Math.round(stream.soundLevel) + '');
            console.warn(`${stream.type} ${stream.streamID}, soundLevel: ${stream.soundLevel}`);
        });
    });
    zg.on("deviceError", async (errorCode, deviceName) => {
        console.log("deviceError", errorCode, deviceName);
        const deviceInfo = await zg.enumDevices();
        const cameras = deviceInfo.cameras;
        const micList = deviceInfo.microphones;
        const currentRoomID = $('#roomId').val() || undefined;
        if (localStreamMap[currentRoomID]) {
            zg.useVideoDevice(localStreamMap[currentRoomID], cameras[0].deviceID);
            zg.useAudioDevice(localStreamMap[currentRoomID], micList[0].deviceID);
        }
    });
    zg.on('videoDeviceStateChanged', (updateType, device) => {
        console.warn(`videoDeviceStateChanged`, device, updateType);
    });
    zg.on('audioDeviceStateChanged', (updateType, deviceType, device) => {
        console.warn(`audioDeviceStateChanged`, device, updateType, deviceType);
    });
    zg.on('roomOnlineUserCountUpdate', (roomID, count) => {
        console.warn(`roomOnlineUserCountUpdate ${roomID} ${count}`);
    });
    zg.on('tokenWillExpire', (roomID) => {
        console.warn('tokenWillExpire', roomID);
    });
    zg.on('beautyEffectError', (stream, code, msg) => {
        console.error('beautyEffectError', code, msg);
    });
    zg.on("playerRecvSEI", (streamID, uintArray) => {
        // const str = decodeString(seiBuf);
        console.warn(
            "recv " + streamID + " sei ",
            uintArray,
        );
        let offset = 0;
        let mediaSideInfoType = 0;
        mediaSideInfoType = uintArray[offset++] << 24;
        mediaSideInfoType |= uintArray[offset++] << 16;
        mediaSideInfoType |= uintArray[offset++] << 8;
        mediaSideInfoType |= uintArray[offset++];

        const seiContent = decodeString(uintArray.subarray(4));

        console.warn('收到 SEI ', mediaSideInfoType, seiContent)
    })
}

async function getToken(userID, roomId, expireTime) {

    let token;
    if (ver !== '00') {
        const res = await $.ajax({
            url: 'https://sig-liveroom-admin.zego.cloud/thirdToken/get',
            type: "POST",
            data: JSON.stringify({
                "version": ver,
                "appId": appID,
                "idName": userID,
                "roomId": roomId,
                "privilege": {
                    "1": 1,
                    "2": 1
                },
                "expire_time": expireTime || 300
            }),
            dataType: "json",
            contentType: "application/json; charset=utf-8"
        })
        token = res.data.token;
    } else {
        token = await $.get('https://wsliveroom-alpha.zego.im:8282/token', {
            app_id: appID,
            id_name: userID,
        });
    }
    return token;
}

function login2(token, roomId, config) {
    return new Promise(async (resolve, reject) => {
        // const res = await $.ajax({
        //     url: 'https://sig-liveroom-admin.zego.cloud/thirdToken/get',
        //     type: "POST",
        //     data: JSON.stringify({
        //         "version": "03",
        //         "appId": appID,
        //         "idName": userID,
        //         "roomId": roomId,
        //         "privilege": {
        //             "1": 1,
        //             "2": 1
        //         },
        //         "expire_time": 3000
        //     }),
        //     dataType: "json",
        //     contentType: "application/json; charset=utf-8"
        // })
        // token = res.data.token;

        const _config = Object.assign({}, { userUpdate: true }, config);

        zg.loginRoom(roomId, token, { userID, userName }, _config).then(res => {
            roomList.push(roomId);
            resolve()
        }).catch(e => {
            reject(e)
        });
    })


}
const login = async (roomId, config) => {
    // 获取token需要客户自己实现，token是对登录房间的唯一验证
    // Obtaining a token needs to be implemented by the customer. The token is the only verification for the login room.

    let token = $("#custom-token").val() || "";
    const expireTime = parseInt($("#custom-expiretime").val())
    //测试用，开发者请忽略
    //Test code, developers please ignore
    if (token) {

    } else if (expireTime) {
        const res = await $.ajax({
            url: 'https://sig-liveroom-admin.zego.cloud/thirdToken/get',
            type: "POST",
            data: JSON.stringify({
                "version": "03",
                "appId": appID,
                "idName": userID,
                "roomId": roomId,
                "privilege": {
                    "1": 1,
                    "2": 1
                },
                "expire_time": expireTime
            }),
            dataType: "json",
            contentType: "application/json; charset=utf-8"
        })
        token = res.data.token;
    } else if (cgiToken) {
        token = await $.get(tokenUrl, {
            app_id: appID,
            id_name: userID,
            cgi_token: cgiToken,
        });
        //测试用结束
        //Test code end
    } else {
        // token = await $.get('https://wsliveroom-alpha.zego.im:8282/token', {
        //     app_id: appID,
        //     id_name: userID,
        // });

        // const res = await $.ajax({
        //     url: 'https://sig-liveroom-admin.zego.cloud/thirdToken/get',
        //     type: "POST",
        //     data: JSON.stringify({
        //         "version": "03",
        //         "appId": appID,
        //         "idName": userID,
        //         "roomId": roomId,
        //         "privilege": {
        //             "1": 1,
        //             "2": 1
        //         },
        //         "expire_time": 3000
        //     }),
        //     dataType: "json",
        //     contentType: "application/json; charset=utf-8"
        // })
        // token = res.data.token;
        token = await getToken(userID, roomId, expireTime);

    }
    const _config = Object.assign({}, { userUpdate: true }, config);

    window.loginTime = new Date().getTime();
    await zg.loginRoom(roomId, token, { userID, userName }, _config);
    const loginConsumed = new Date().getTime() - window.loginTime;
    console.warn('登录房间耗时 ' + loginConsumed);

    roomList.push(roomId);

    return true;
}

async function enterRoom() {
    const roomId = $('#roomId').val();
    if (!roomId) {
        alert('roomId is empty');
        return false;
    }

    // for (let i = 0; i < useLocalStreamList.length; i++) {
    //     useLocalStreamList[i].streamID && zg.stopPlayingStream(useLocalStreamList[i].streamID);
    // }

    logouted = false;
    await login(roomId);
    loginRoom = true;

    // console.warn('remoteVideo')
    // $('.remoteVideo').html('');

    return true;
}

function clear() {
    const roomId = $('#roomId').val();

    playQualityList = {};

    // 清空页面
    // Clear page
    useLocalStreamList = [];
    // window.useLocalStreamList = [];

    roomList.splice(roomList.findIndex(room => room == roomId), 1);

    if (previewVideo.srcObject && (!roomId || roomList.length == 0)) {
        previewVideo.srcObject = null;
        zg.stopPublishingStream(publishStreamId);
        zg.destroyStream(localStreamMap[roomId]);
        isPreviewed = false;
        !$('.sound').hasClass('d-none') && $('.sound').addClass('d-none');
    }

    if (!roomId || roomList.length == 0) {
        $('.remoteVideo').html('');
        $('#memberList').html('');
    }

    loginRoom = false;
    publishType = undefined;
}

async function logout() {
    console.info('leave room  and close stream');
    const roomId = $('#roomId').val();
    logouted = true;
    // 停止拉流
    // stop playing
    for (let i = 0; i < useLocalStreamList.length; i++) {
        useLocalStreamList[i].streamID && zg.stopPlayingStream(useLocalStreamList[i].streamID);
    }

    playQualityList = {};

    // 清空页面
    // Clear page
    useLocalStreamList = [];
    // window.useLocalStreamList = [];

    roomList.splice(roomList.findIndex(room => room == roomId), 1);
    if (sendSEITimer) {
        clearInterval(sendSEITimer);
        sendSEITimer = null;
    }
    if (previewVideo.srcObject && (!roomId || roomList.length == 0)) {
        previewVideo.srcObject = null;
        zg.stopPublishingStream(publishStreamId);
        zg.destroyStream(localStreamMap[roomId]);
        isPreviewed = false;
        !$('.sound').hasClass('d-none') && $('.sound').addClass('d-none');
    }

    if (!roomId || roomList.length == 0) {
        $('.remoteVideo').html('');
        $('#memberList').html('');
    }

    //退出登录
    //logout
    zg.logoutRoom(roomId);
    loginRoom = false;
    publishType = undefined;
}

async function publish(constraints, isNew) {
    console.warn('createStream', $('#audioList').val(), $('#videoList').val());
    console.warn('constraints', constraints);

    // console.error('playType', playType);
    push(constraints, {}, isNew);
}

const startPreview = async (constraints = {}) => {
    const video =
        constraints && constraints.camera && typeof constraints.camera.video === 'boolean'
            ? constraints.camera.video
            : undefined;

    const _constraints = {
        camera: {
            audioInput: $('#audioList').val(),
            videoInput: $('#videoList').val(),
            video: video !== undefined ? video : $('#videoList').val() === '0' ? false : true,
            audio: $('#audioList').val() === '0' ? false : true,
            videoOptimizationMode: $('#videoOptimizationMode').val() ? $('#videoOptimizationMode').val() : "default",
            startBitrate: "target",
            // channelCount: constraints && constraints.camera && constraints.camera.channelCount,
        },
    };
    constraints && constraints.camera && Object.assign(_constraints.camera, constraints.camera);
    !_constraints.camera.video && (previewVideo.controls = true);
    const playType =
        _constraints.camera.audio === false ? 'Video' : _constraints.camera.video === false ? 'Audio' : 'all';
    publishType = playType;

    const currentRoomID = $('#roomId').val() || undefined;
    if (localStreamMap[currentRoomID]) {
        zg.destroyStream(localStreamMap[currentRoomID])
    }
    try {
        const previewTime = new Date().getTime();
        if (_constraints.camera) {
            getVideoFrame(_constraints.camera);
        }

        localStreamMap[currentRoomID] = await zg.createStream(_constraints);

        const timer = setInterval(()=>{
            if (localStreamMap[currentRoomID] && isPreviewed) {
                console.warn('获取的媒体流：', JSON.stringify( localStreamMap[currentRoomID].getVideoTracks()[0].getSettings() ));
            } else {
                clearInterval(timer);
            }
        }, 3000);

        const previewConsumed = new Date().getTime() - previewTime;
        console.warn('createStream success! 预览耗时 ' + previewConsumed);
        if (zg.getVersion() >= "2.17.0" && document.getElementById("local-view")) {
            const stream = localStreamMap[currentRoomID]
            const viewer = zg.createLocalStreamView(stream);
            bindViewCtrl(viewer);
            console.warn('enable-dialog', $("#enable-dialog").val() != "0");
            viewer.play("local-view", { enableAutoplayDialog: $("#enable-dialog").val() != "0" });
            $("#previewVideo").hide()
        } else {
            $("#previewVideo").show()
        }
        previewVideo.srcObject = localStreamMap[currentRoomID];

        isPreviewed = true;
        $('.sound').hasClass('d-none') && $('.sound').removeClass('d-none');
        if (zg.createAudioEffectPlayer) {

            effectPlayer = zg.createAudioEffectPlayer(
                localStreamMap[currentRoomID]
            )
        }
        return {
            playType
        }
        isNew && (publishStreamId = 'webrtc' + new Date().getTime());
        if($("#videoCodec").val()) publishOption.videoCodec = $("#videoCodec").val();
        if ($('#roomId').val()) publishOption.roomID = $('#roomId').val();

        if ($("#enableDualStream").val() == "1") {
          //debugger;
          zg.enableDualStream(localStream);
        }

        const result = zg.startPublishingStream(publishStreamId, localStream, publishOption);
        console.log('publish stream' + publishStreamId, result);
    } catch (err) {
        if (err.name) {
            console.error('createStream', err.name, err.message);
        } else {
            console.error('createStream error', err);
        }
        throw err
    }
}

function getVideoFrame(camera) {
    const { frameRate, videoQuality } = camera;
    if (frameRate) {
        sendSEIFPS = frameRate;
    } else if (videoQuality == 1 || videoQuality == 2) {
        sendSEIFPS = 15;
    } else if (videoQuality == 3) {
        sendSEIFPS = 20;
    }
}

const getPreviewStream = () => {
    const stream = localStreamMap[$('#roomId').val()]

    return stream
}
const getEffectPlayer = () => {
    return effectPlayer

}

const startPublish = async (publishOption = {}, isNew) => {
    isNew && (publishStreamId = 'webrtc' + new Date().getTime());
    if ($("#videoCodec").val()) publishOption.videoCodec = $("#videoCodec").val();
    const currentRoomID = $('#roomId').val()
    publishOption.roomID = currentRoomID;
    let completeStreamID = publishStreamId
    if (zg.zegoWebRTM.stateCenter.isMultiRoom) {
        completeStreamID = publishOption.roomID + "-" + publishStreamId
    }
    window.publishTime = new Date().getTime();
    publishOption.isSEIStart = sei;
    if ($("#seiType").val() == '1') {
        publishOption.SEIType = 1;
    }
    const result = await zg.startPublishingStream(completeStreamID, localStreamMap[currentRoomID], publishOption);

    console.log('publish stream' + completeStreamID, result);
}

const stopPublish = async () => {
    const currentRoomID = $('#roomId').val()
    let completeStreamID = publishStreamId
    if (zg.zegoWebRTM.stateCenter.isMultiRoom) {
        completeStreamID = currentRoomID + "-" + publishStreamId
    }
    const result = zg.stopPublishingStream(completeStreamID);
    console.warn('stop publish stream' + completeStreamID, result);
}


async function push(constraints, publishOption = {}, isNew) {
    const { playType } = await startPreview(constraints)
    await startPublish({ ...publishOption, extraInfo: JSON.stringify({ playType }) }, isNew)

    // var AudioContext = window.AudioContext || window.webkitAudioContext; // 兼容性
    // let localTrack= localStream.getAudioTracks()[0];
    // let audioContext = new AudioContext();// 创建Audio上下文
    // let mediaStreamSource = audioContext.createMediaStreamSource(localStream);
    // let destination = audioContext.createMediaStreamDestination();
    // let gainNode = audioContext.createGain();
    // mediaStreamSource.connect(gainNode);
    // gainNode.connect(destination);
    // gainNode.gain.value=3;
    // let audioTrack = destination.stream.getAudioTracks()[0];
    // localStream.removeTrack(localTrack);
    // localStream.addTrack(audioTrack);


}

$('#toggleCamera').click(function () {
    zg.mutePublishStreamVideo(previewVideo.srcObject, !$(this).hasClass('disabled'), $('#retainPreview').val() == 1 ? true : false);
    $(this).toggleClass('disabled');
});
$("#toggleVideoCapturing").click(function () {
    $("#toggleVideoCapturing").toggleClass("disabled");
    const result = zg.enableVideoCaptureDevice(
        $("#previewVideo")[0].srcObject,
        !$("#toggleVideoCapturing").hasClass("disabled")
    );
    console.log("toggleCamera", result);
});
$('#toggleSpeaker').click(function () {
    zg.mutePublishStreamAudio(previewVideo.srcObject, !$(this).hasClass('disabled'));
    $(this).toggleClass('disabled');
});

$('#enterRoom').click(async () => {
    let loginSuc = false;
    try {
        loginSuc = await enterRoom();
        const currentRoomID = $('#roomId').val()
        if (loginSuc) {
            if (localStreamMap[currentRoomID]) {
                zg.destroyStream(localStreamMap[currentRoomID])
            }
            startPreview({})
            isPreviewed = true;
            $('#videoList').val() === '0' && (previewVideo.controls = true);
        }
    } catch (error) {
        console.error(error);
    }
});

$("#view-play-options").val(`
{
  "objectFit": "contain",
  "mirror": false,
  "enableAutoPlayDialog": true
}
`);
function getViewOptions() {
    let playOptions = undefined;
    try {
        playOptions = JSON.parse($("#view-play-options").val());
    } catch (error) {
        console.error("getViewOptions", error);
    }
    return playOptions;
}
function bindViewCtrl(view, id = "") {
    let video = true;
    let audio = true;
    $("#local-ctrl-resume" + id).off("click");
    $("#local-ctrl-resume" + id).on("click", () => {
        view.resume();
    });
    $("#local-ctrl-play" + id).off("click");
    $("#local-ctrl-play" + id).on("click", () => {
        view.play(id || "local-view", getViewOptions());
    });
    $("#local-ctrl-stop" + id).off("click");
    $("#local-ctrl-stop" + id).on("click", () => {
        view.stop();
    });
    $("#local-ctrl-video" + id).off("click");
    $("#local-ctrl-video" + id).on("click", () => {
        const res = view.setVideoMuted(!video);
        if (res) {
            video = !video;
            $("#local-ctrl-video-state" + id).text(
                `视频: ${video ? "关闭" : "开启"};`
            );
        }
        console.warn("setVideoMuted", video ? "关闭" : "开启", res);
    });
    $("#local-ctrl-audio" + id).off("click");
    $("#local-ctrl-audio" + id).on("click", () => {
        const res = view.setAudioMuted(!audio);
        if (res) {
            audio = !audio;
            $("#local-ctrl-audio-state" + id).text(
                `音频：${audio ? "关闭" : "开启"};`
            );
        }
        console.warn("setAudioMuted", audio ? "关闭" : "开启", res);
    });
    $("#local-ctrl-volume" + id).on("change", () => {
        const res = view.setVolume($("#local-ctrl-volume" + id).val());
        console.warn("setVolume", res);
    });
    $("#local-ctrl-speaker" + id).on("click", async () => {
        try {
            const res = await view.useAudioOutputDevice($('#speakerList').val());
        } catch (error) {
            alert(error)
            throw error
        }

    })
}


export {
    zg,
    appID,
    publishStreamId,
    checkAnRun,
    supportScreenSharing,
    userID,
    useLocalStreamList,
    login,
    login2,
    logout,
    enterRoom,
    push,
    publish,
    previewVideo,
    isPreviewed,
    loginRoom,
    publishType,
    l3,
    roomList,
    getEffectPlayer,
    enumDevices,
    getToken,
    clear,
    logouted,
    startPreview,
    startPublish,
    stopPublish,
    localStreamMap,
    getPreviewStream,
    sei,
    getViewOptions,
    bindViewCtrl
};

// $(window).on('unload', function() {
//     logout();
// });
