/* eslint-disable @typescript-eslint/no-use-before-define */
import VConsole from "vconsole";
import "../assets/bootstrap.min";
import "../assets/bootstrap.min.css";
import { ZegoExpressEngine } from "zego-express-engine-webrtc";
import { getCgi } from "../content";
import { getBrowser } from "../assets/utils";
// import { getToken } from '../common.js';

new VConsole();
let publishStreamId = "webrtc" + new Date().getTime();
let zg;
let isAccess;
let appID = 2375819786;//383110717;//2195363310; //2845718148; //1739272706; // 请从官网控制台获取对应的appID
({ appID, isAccess } = getCgi(appID));
let server = "wss://webliveroom" + appID + "-api.zego.im/ws"; //'wss://wsliveroom-alpha.zego.im:8282/ws';//'ws://192.168.100.149:8181/ws';// 'wss://webliveroom-test.zego.im/ws'; // 请从官网控制台获取对应的server地址，否则可能登录失败


//const appSign = '';
let previewVideo;
let useLocalStreamList = [];
let isPreviewed = false;
let supportScreenSharing = false;
let loginRoom = false;

let localStream;
let publishType;
let token, userID, expireTime;
let isPeer;
let roomList = [];
// eslint-disable-next-line prefer-const
zg = new ZegoExpressEngine(appID, server);

if (isAccess === false) {
    zg.zegoWebRTC.setAccess(false);
    // zg.zegoWebRTM.stateCenter.useNetAgent = false;
    // zg.zegoWebRTC.stateCenter.useNetAgent = false;
}


zg.zegoWebRTC.rtcModules.streamCenter.isPeer = isPeer == true ? true : false;
window.zg = zg;
window.useLocalStreamList = useLocalStreamList;

async function checkAnRun(checkScreen) {
    console.log("sdk version is", zg.getVersion());
    try {
        const result = await zg.checkSystemRequirements();

        console.warn("checkSystemRequirements ", result);
        !result.videoCodec.H264 &&
            $("#videoCodeType option:eq(1)").attr("disabled", "disabled");
        !result.videoCodec.VP8 &&
            $("#videoCodeType option:eq(2)").attr("disabled", "disabled");

        if (!result.webRTC) {
            alert("browser is not support webrtc!!");
            return false;
        } else if (!result.videoCodec.H264 && !result.videoCodec.VP8) {
            alert("browser is not support H264 and VP8");
            return false;
        } else if (result.videoCodec.H264) {
            supportScreenSharing = result.screenSharing;
            if (checkScreen && !supportScreenSharing)
                alert("browser is not support screenSharing");
            previewVideo = $("#previewVideo")[0];
            start();
        } else {
            alert("不支持H264，请前往混流转码测试");
        }

        return true;
    } catch (err) {
        console.error("checkSystemRequirements", err);
        return false;
    }
}

async function getToken(userID, roomId, expireTime) {
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
    const token = res.data.token;
 
    return token;
}


async function start() {
    initSDK();

    zg.setLogConfig({
        logLevel: "debug",
        remoteLogLevel: "info",
        logURL: "",
    });

    zg.setDebugVerbose(false);
    zg.setSoundLevelDelegate(true, 3000);

    
    $("#createRoom").click(async () => {
        await enterRoom();
        await publish();
    });
    $("#openRoom").click(async () => {
        await enterRoom();
        // await publish();
    });

    $("#leaveRoom").click(function () {
        logout();
    });
}

async function enumDevices() {
    const audioInputList = [],
        videoInputList = [];
    const deviceInfo = await zg.enumDevices();

    deviceInfo &&
        deviceInfo.microphones.map((item, index) => {
            if (!item.deviceName) {
                item.deviceName = "microphone" + index;
            }
            audioInputList.push(
                ' <option value="' +
                item.deviceID +
                '">' +
                item.deviceName +
                "</option>"
            );
            console.log("microphone: " + item.deviceName);
            return item;
        });

    deviceInfo &&
        deviceInfo.cameras.map((item, index) => {
            if (!item.deviceName) {
                item.deviceName = "camera" + index;
            }
            videoInputList.push(
                ' <option value="' +
                item.deviceID +
                '">' +
                item.deviceName +
                "</option>"
            );
            console.log("camera: " + item.deviceName);
            return item;
        });

    audioInputList.push('<option value="0">禁止</option>');
    videoInputList.push('<option value="0">禁止</option>');

    $("#audioList").html(audioInputList.join(""));
    $("#videoList").html(videoInputList.join(""));
}

function initSDK() {
    enumDevices();

    zg.on("roomStateUpdate", (roomID, state, errorCode, extendedData) => {
        console.log("roomStateUpdate: ", roomID, state, errorCode, extendedData);
    });
    zg.on("roomUserUpdate", (roomID, updateType, userList) => {
        console.warn(
            `roomUserUpdate: room ${roomID}, user ${updateType === "ADD" ? "added" : "left"
            } `,
            JSON.stringify(userList)
        );
    });
    zg.on("publisherStateUpdate", (result) => {
        console.log("publisherStateUpdate: ", result.streamID, result.state);
        if (result.state == "PUBLISHING") {
            console.info(" publish  success " + result.streamID);
        } else if (result.state == "PUBLISH_REQUESTING") {
            console.info(" publish  retry");
        } else {
            if (result.errorCode == 0) {
                console.warn("publish stop " + result.errorCode + ' ' + result.extendedData);
            } else {
                console.error("publish error " + result.errorCode + ' ' + result.extendedData);
                // 停止推流
                // stop publishing
                if (isPreviewed) {
                    zg.stopPublishingStream(publishStreamId);
                    zg.destroyStream(localStream);
                    isPreviewed = false;
                    previewVideo.srcObject = null;
                }
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
    zg.on("playerStateUpdate", (result) => {
        console.log("playerStateUpdate", result.streamID, result.state);
        if (result.state == "PLAYING") {
            console.info(" play  success " + result.streamID);
            const browser = getBrowser();
            console.warn("browser", browser);
            if (browser === "Safari") {
                const videos = $(".remoteVideo video");
                for (let i = 0; i < videos.length; i++) {
                    videos[i].srcObject = videos[i].srcObject;
                }
            }
        } else if (result.state == "PLAY_REQUESTING") {
            console.info(" play  retry");
        } else {
            if (result.errorCode == 0) {
                console.warn("play stop " + result.errorCode + ' ' + result.extendedData);
            } else {
                console.error("play error " + result.errorCode + ' ' + result.extendedData);
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
    zg.on("streamExtraInfoUpdate", (roomID, streamList) => {
        console.warn(
            `streamExtraInfoUpdate: room ${roomID},  `,
            JSON.stringify(streamList)
        );
    });
    zg.on(
        "roomStreamUpdate",
        async (roomID, updateType, streamList, extendedData) => {
            console.log(
                "roomStreamUpdate 1 roomID ",
                roomID,
                streamList,
                extendedData
            );
            // let queue = []
            if (updateType == "ADD") {
                for (let i = 0; i < streamList.length; i++) {
                    console.info(streamList[i].streamID + " was added");
                    let remoteStream;
                    let playOption;

                    if ($("#videoCodec").val())
                        playOption.videoCodec = $("#videoCodec").val();


                    zg.startPlayingStream(streamList[i].streamID, playOption)
                        .then((stream) => {
                            remoteStream = stream;
                            useLocalStreamList.push(streamList[i]);
                            let videoTemp = $(
                                `<video id=${streamList[i].streamID} autoplay muted playsinline controls></video>`
                            );
                            //queue.push(videoTemp)
                            $(".remoteVideo").append(videoTemp);
                            const video = $(".remoteVideo video:last")[0];
                            console.warn("video", video, remoteStream);
                            video.srcObject = remoteStream;
                            video.muted = false;
                            // videoTemp = null;
                        })
                        .catch((err) => {
                            console.error("err", err);
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
            } else if (updateType == "DELETE") {
                for (let k = 0; k < useLocalStreamList.length; k++) {
                    for (let j = 0; j < streamList.length; j++) {
                        if (useLocalStreamList[k].streamID === streamList[j].streamID) {
                            try {
                                zg.stopPlayingStream(useLocalStreamList[k].streamID);
                            } catch (error) {
                                console.error(error);
                            }

                            console.info(useLocalStreamList[k].streamID + "was devared");

                            $(".remoteVideo video:eq(" + k + ")").remove();
                            useLocalStreamList.splice(k--, 1);
                            break;
                        }
                    }
                }
            }
        }
    );

    zg.on("playQualityUpdate", async (streamID, streamQuality) => {
        console.log(
            `play#${streamID} videoFPS: ${streamQuality.video.videoFPS} videoBitrate: ${streamQuality.video.videoBitrate} audioBitrate: ${streamQuality.audio.audioBitrate} audioFPS: ${streamQuality.audio.audioFPS}`
        );
        console.log(`play#${streamID}`, streamQuality);
    });

    zg.on("publishQualityUpdate", async (streamID, streamQuality) => {
        console.log(
            `publish#${streamID} videoFPS: ${streamQuality.video.videoFPS} videoBitrate: ${streamQuality.video.videoBitrate} audioBitrate: ${streamQuality.audio.audioBitrate} audioFPS: ${streamQuality.audio.audioFPS}`
        );
        console.log(`publish#${streamID}`, streamQuality);
    });

    zg.on("remoteCameraStatusUpdate", (streamID, status) => {
        console.warn(
            `remoteCameraStatusUpdate ${streamID} camera status ${status == "OPEN" ? "open" : "close"
            }`
        );
    });

    zg.on("remoteMicStatusUpdate", (streamID, status) => {
        console.warn(
            `remoteMicStatusUpdate ${streamID} micro status ${status == "OPEN" ? "open" : "close"
            }`
        );
    });

    zg.on("soundLevelUpdate", (streamList) => {
        streamList.forEach((stream) => {
            stream.type == "push" &&
                $("#soundLevel").html(Math.round(stream.soundLevel) + "");
            console.warn(
                `${stream.type} ${stream.streamID}, soundLevel: ${stream.soundLevel}`
            );
        });
    });
    zg.on("deviceError", async(errorCode, deviceName) => {
        console.log("deviceError", errorCode, deviceName);
        const deviceInfo = await zg.enumDevices();
        const cameras = deviceInfo.cameras;
        const micList = deviceInfo.microphones;
        if(localStream) {
          zg.useVideoDevice(localStream, cameras[0].deviceID);
          zg.useAudioDevice(localStream, micList[0].deviceID);
        }
    });
    zg.on("videoDeviceStateChanged", (updateType, device) => {
        console.warn(`videoDeviceStateChanged`, device, updateType);
    });
    zg.on("audioDeviceStateChanged", (updateType, deviceType, device) => {
        console.warn(`audioDeviceStateChanged`, device, updateType, deviceType);
    });
    zg.on("roomOnlineUserCountUpdate", (roomID, count) => {
        console.warn(`roomOnlineUserCountUpdate ${roomID} ${count}`);
    });

    zg.on("tokenWillExpire", (roomID) => {
        console.warn(`tokenWillExpire ${roomID}`);
    });
    
    $("#createToken").click(async () => {
        const _expireTime = document.querySelector("#expireTime").value;
        expireTime = parseInt(_expireTime);
        const roomID = document.querySelector("#roomId").value;
        userID = document.querySelector("#userID").value;
        token = await getToken(userID, roomID, expireTime);
        document.querySelector("#tokenRole").value = token;
    });
    $("#renewToken").click(async () => {
        // token = document.querySelector("#tokenRole").value;
        const roomID = document.querySelector("#roomId").value;
        const _expireTime = document.querySelector("#expireTime").value;
        expireTime = parseInt(_expireTime);
        userID = document.querySelector("#userID").value;
        token = await getToken(userID, roomID, expireTime);
        document.querySelector("#tokenRole").value = token;
        zg.renewToken(token, roomID);
    });
}

async function enterRoom() {
    const roomId = $("#roomId").val();
    if (!roomId) {
        alert("roomId is empty");
        return false;
    }

    // for (let i = 0; i < useLocalStreamList.length; i++) {
    //     useLocalStreamList[i].streamID &&
    //         zg.stopPlayingStream(useLocalStreamList[i].streamID);
    // }

    await login(roomId);

    loginRoom = true;

    // console.warn("remoteVideo");
    // $(".remoteVideo").html("");

    return true;
}

async function login(roomId) {
    userID = document.querySelector("#userID").value;
    // userID = 'sample' + new Date().getTime();
    // userID = 'sample1644905679033';

    if (!token) {
        const _expireTime = document.querySelector("#expireTime").value;
        expireTime = parseInt(_expireTime);
        token = await getToken(userID, roomId, expireTime);
        document.querySelector("#tokenRole").value = token;
        if (!token) {
            alert('token 为空')
        }
    }
    
    console.error('token', token)
    await zg.loginRoom(roomId, token, { userID, userName: 'test' + userID }, { userUpdate: true });
    roomList.push(roomId);
}

async function publish(constraints, isNew) {
    console.warn("createStream", $("#audioList").val(), $("#videoList").val());
    console.warn("constraints", constraints);
    const video =
        constraints &&
            constraints.camera &&
            typeof constraints.camera.video === "boolean"
            ? constraints.camera.video
            : undefined;

    const _constraints = {
        camera: {
            audioInput: $("#audioList").val(),
            videoInput: $("#videoList").val(),
            video:
                video !== undefined
                    ? video
                    : $("#videoList").val() === "0"
                        ? false
                        : true,
            audio: $("#audioList").val() === "0" ? false : true,
            // channelCount: constraints && constraints.camera && constraints.camera.channelCount,
        },
    };
    constraints &&
        constraints.camera &&
        Object.assign(_constraints.camera, constraints.camera);
    !_constraints.camera.video && (previewVideo.controls = true);
    const playType =
        _constraints.camera.audio === false
            ? "Video"
            : _constraints.camera.video === false
                ? "Audio"
                : "all";
    publishType = playType;
    // console.error('playType', playType);
    push(_constraints, { extraInfo: JSON.stringify({ playType }) }, isNew);
}
async function push(constraints, publishOption, isNew) {
    try {
        if (!publishOption) publishOption = {};
        localStream = await zg.createStream(constraints);
        previewVideo.srcObject = localStream;
        isPreviewed = true;
        $(".sound").hasClass("d-none") && $(".sound").removeClass("d-none");
        const publishStreamId = "webrtc" + new Date().getTime();
        if ($("#videoCodec").val())
            publishOption.videoCodec = $("#videoCodec").val();
        if ($("#roomId").val()) publishOption.roomID = $("#roomId").val();
        const result = zg.startPublishingStream(
            publishStreamId,
            localStream,
            publishOption
        );
        console.log("publish stream" + publishStreamId, result);
    } catch (err) {
        if (err.name) {
            console.error("createStream", err.name, err.message);
        } else {
            console.error("createStream error", err);
        }
    }
}
async function logout() {
    console.info('leave room  and close stream');
    const roomId = $('#roomId').val();
    // 停止拉流
    // stop playing
    for (let i = 0; i < useLocalStreamList.length; i++) {
        useLocalStreamList[i].streamID && zg.stopPlayingStream(useLocalStreamList[i].streamID);
    }

    // 清空页面
    // Clear page
    useLocalStreamList = [];
    // window.useLocalStreamList = [];

    roomList.splice(roomList.findIndex(room => room == roomId), 1);

    if (previewVideo.srcObject && isPreviewed && (!roomId || roomList.length == 0)) {
        previewVideo.srcObject = null;
        zg.stopPublishingStream(publishStreamId);
        zg.destroyStream(localStream);
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
}

$(async () => {
    await checkAnRun();
    $("#publish").click(() => {
        push();
    });

    // $("#").click(() => {
    //     token = document.querySelector("#tokenRole").value;
    //     const result = zg.renewToken(token);
    // });
});
