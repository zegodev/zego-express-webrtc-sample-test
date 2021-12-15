import { checkAnRun, zg, useLocalStreamList, enterRoom, previewVideo, logout, publish, publishStreamId, l3, enumDevices } from '../common';
import { getBrowser } from '../assets/utils';

let playOption = {};
// --test begin
let previewStream;
let published = false;
const publishStreamID = 'web-' + new Date().getTime();
let remoteStreamID = ""
// ---test end
let cameraStreamVideoTrack;
let externalStreamVideoTrack;
let screenStreamVideoTrack;
let externalStream
let screenStream
let videoType

$(async () => {
    await checkAnRun();

    // --- test begin
    $('#publish').click(() => {
        const publishStreamID = new Date().getTime() + '';

        // !cameraStreamVideoTrack && previewVideo.srcObject && (cameraStreamVideoTrack = previewStream.getVideoTracks()[0] && previewStream.getVideoTracks()[0].clone());
        const result = zg.startPublishingStream(publishStreamID, previewStream ? previewStream : previewVideo.srcObject, { roomID: $('#roomId').val() });
        published = true;
        console.log('publish stream' + publishStreamID, result);
    });

    $('#useVideo').click(() => {
        zg.useVideoDevice(previewVideo.srcObject, $('#videoList').val());
    });

    $('#useAudio').click(() => {
        zg.useAudioDevice(previewVideo.srcObject, $('#audioList').val());
    });
    // --- test end

    $('#reAcquireDevice').click(() => {
        enumDevices()
    })
    $('#createRoom').unbind('click');
    $('#createRoom').click(async () => {
        let loginSuc = false;
        const constraints = {};
        const channelCount = parseInt($('#channelCount').val());
        constraints.channelCount = channelCount;
        const videoQuality = $('#videoQuality').val();
        if (videoQuality == 4) {
            $('#width').val() && (constraints.width = parseInt($('#width').val())),
                $('#height').val() && (constraints.height = parseInt($('#height').val())),
                $('#frameRate').val() && (constraints.frameRate = parseInt($('#frameRate').val())),
                $('#bitrate').val() && (constraints.bitrate = parseInt($('#bitrate').val()))
        }
        $('#noiseSuppression').val() === '1' ? (constraints.ANS = true) : (constraints.ANS = false);
        $('#autoGainControl').val() === '1' ? (constraints.AGC = true) : (constraints.AGC = false);
        $('#echoCancellation').val() === '1' ? (constraints.AEC = true) : (constraints.AEC = false);
        $('#audioBitrate').val() && (constraints.audioBitrate = parseInt($('#audioBitrate').val()));

        constraints.videoQuality = parseInt(videoQuality);
        console.warn('constraints', constraints);
        try {
            loginSuc = await enterRoom();
            loginSuc && (await publish({ camera: constraints }));
        } catch (error) {
            console.error(error);
        }
    });
    $('#openRoom').unbind('click');
    $('#openRoom').click(async () => {
        await enterRoom();
    });
    $('#extraInfo').click(() => {
        zg.setStreamExtraInfo(publishStreamId, $('#extraInfoInput').val());
    });
    $('#switchConstraints').click(() => {
        const constraints = {};
        const w = $('#width').val() ? parseInt($('#width').val()) : 0;
        const h = $('#height').val() ? parseInt($('#height').val()) : 0;
        const f = $('#frameRate').val() ? parseInt($('#frameRate').val()) : 0;
        const b = $('#bitrate').val() ? parseInt($('#bitrate').val()) : 0;

        w && Object.assign(constraints, { width: w });
        h && Object.assign(constraints, { height: h });
        f && Object.assign(constraints, { frameRate: f });
        b && Object.assign(constraints, { maxBitrate: b });

        zg.setVideoConfig(previewVideo.srcObject, constraints).then(
            () => {
                console.warn('change constraints success');
            },
            err => {
                console.error(err);
            },
        );
    });

    $('#setAudioConfig').click(() => {
        const constraints = {};
        let ANS, AGC, AEC;
        $('#noiseSuppression').val() === '1' ? (ANS = true) : (ANS = false);
        $('#autoGainControl').val() === '1' ? (AGC = true) : (AGC = false);
        $('#echoCancellation').val() === '1' ? (AEC = true) : (AEC = false);
        Object.assign(constraints, { ANS, AGC, AEC })
        zg.setAudioConfig(previewVideo.srcObject, constraints).then((res) => {
            console.warn('change constraints success', res);
        }, err => {
            console.error(JSON.stringify(err));
        })
    })

    $('#startCheckSystem').click(async () => {
        const select = document.querySelector("#checkType");
        const value = select.options[select.selectedIndex].value;
        const res = await zg.checkSystemRequirements(value);
        console.log(JSON.stringify(res));
        const resultDiv = document.querySelector("#checkResult");
        resultDiv.innerHTML = value + ": " + JSON.stringify(res);
    })

    // $('#mutePlayStreamVideo').click(() => {
    //     useLocalStreamList.forEach(item => {
    //         zg.zegoWebRTC.mutePlayStreamVideo(item.streamID, !$(this).hasClass('disabled'));
    //     })
    //     $(this).toggleClass('disabled');
    // })
    // $('#mutePlayStreamAudio').click(() => {
    //     useLocalStreamList.forEach(item => {
    //         zg.zegoWebRTC.mutePlayStreamAudio(item.streamID, !$(this).hasClass('disabled'));
    //     })
    //     $(this).toggleClass('disabled');
    // })

    $("#custom-resetToken").click(() => {
        const token = $("#custom-token").val()
        const roomID = $('#roomId').val()
        const res = zg.renewToken(token, roomID)
        console.warn("renewToken", token, roomID, res)
    })

    $('#tcpOnly').change((e) => {
        // console.error(e.target.value);
        const tcpOnly = e.target.value;
        console.warn('tcporudp: ', e.target.value === '0' ? 'auto' : e.target.value === '1' ? 'tcp' : 'udp');
        if (tcpOnly === '1') {
            zg.zegoWebRTC.setTurnOverTcpOnly(true);
        } else if (tcpOnly === '2') {
            zg.zegoWebRTC.setTurnOverTcpOnly(false);
        }
    })
    $('#playVideo').click(() => {
        const videos = $('.remoteVideo video');
        // console.error('videos', videos);
        for (let i = 0; i < videos.length; i++) {
            if (videos[i].paused) {
                videos[i].play().then(res => {
                    console.warn('id ', videos[i].id, res)
                }).catch(err => {
                    console.error('id ', videos[i].id, err)
                });
            }
        }
    })

    // 操作拉流音视频
    $("#togglePlayAudio").click(async () => {
        $("#togglePlayAudio").toggleClass("disabled");
        const result = await zg.mutePlayStreamAudio(
            remoteStreamID,
            $("#togglePlayAudio").hasClass("disabled")
        );
        console.log("togglePlayAudio", result);
    });
    $("#togglePlayVideo").click(async () => {
        $("#togglePlayVideo").toggleClass("disabled");
        const result = await zg.mutePlayStreamVideo(
            remoteStreamID,
            $("#togglePlayVideo").hasClass("disabled")
        );
        console.log("togglePlayAudio", result);
    });
    let isBeauty = false
    async function setBeautyEffect(enable) {
        if (enable === undefined) {
            enable = isBeauty
        } else {
            isBeauty = enable
        }

        // 设置美颜之前保存摄像头视轨
        !cameraStreamVideoTrack && previewVideo.srcObject && (cameraStreamVideoTrack = previewVideo.srcObject.getVideoTracks()[0] && previewVideo.srcObject.getVideoTracks()[0].clone());
        const beautyConfig = {
            sharpnessLevel: parseInt($("#range-sharp").val()) / 100,
            lightingLevel: parseInt($("#range-light").val()) / 100,
            rednessLevel: parseInt($("#range-red").val()) / 100,
            blurLevel: parseInt($("#range-blur").val()) / 100
        }
        const res = await zg.setBeautyEffect(
            $("#previewVideo")[0].srcObject,
            enable, beautyConfig
        );
        console.warn("setBeautyEffect", res, beautyConfig);
    }
    $("#range-sharp").on("change", () => { setBeautyEffect(isBeauty) })
    $("#range-light").on("change", () => { setBeautyEffect(isBeauty) })
    $("#range-red").on("change", () => { setBeautyEffect(isBeauty) })
    $("#range-blur").on("change", () => { setBeautyEffect(isBeauty) })
    $("#openVideoEffect").on("click", () => {
        setBeautyEffect(true);
        console.warn("openVideoEffect");
    });
    $("#closeVideoEffect").on("click", () => {
        setBeautyEffect(false);
        console.warn("closeVideoEffect");
    });

    // 切换视轨
    $('#replaceCamera').click(async function () {
        if (!previewVideo.srcObject) {
            alert('先创建流');
            return;
        }

        // 设置美颜之前保存摄像头视轨
        !cameraStreamVideoTrack && previewVideo.srcObject && (cameraStreamVideoTrack = previewVideo.srcObject.getVideoTracks()[0] && previewVideo.srcObject.getVideoTracks()[0].clone());

        zg.replaceTrack(previewVideo.srcObject, cameraStreamVideoTrack)
            .then(res => {
                console.warn('replaceTrack success');
                videoType = 'camera';
            })
            .catch(err => console.error(err));
    });
    $('#replaceExternalVideo').click(async function () {
        if (!previewVideo.srcObject) {
            alert('流不存在');
            return;
        }
        // 优先保存摄像头视轨
        !cameraStreamVideoTrack && previewVideo.srcObject && (cameraStreamVideoTrack = previewVideo.srcObject.getVideoTracks()[0] && previewVideo.srcObject.getVideoTracks()[0].clone());
        if (!externalStream) {
            externalStream = await zg.createStream({
                custom: {
                    source: $('#customVideo')[0],
                    videoOptimizationMode: $('#videoOptimizationMode').val() ? $('#videoOptimizationMode').val() : "default"
                }
            });
            externalStreamVideoTrack = externalStream.getVideoTracks()[0];
            console.log('externalStreamVideoTrack', externalStreamVideoTrack);
        }

        zg.replaceTrack(previewVideo.srcObject, externalStreamVideoTrack)
            .then(res => {
                console.warn('replace custom track success');
                videoType = 'external';
            })
            .catch(err => console.error(err));
    });
    $('#replaceScreenVideo').click(async function () {
        if (!previewVideo.srcObject) {
            alert('流不存在');
            return;
        }
        // 设置美颜之前保存摄像头视轨
        !cameraStreamVideoTrack && previewVideo.srcObject && (cameraStreamVideoTrack = previewVideo.srcObject.getVideoTracks()[0] && previewVideo.srcObject.getVideoTracks()[0].clone());
        if (!screenStream) {
            screenStream = await zg.createStream({
                screen: true
            });
            screenStreamVideoTrack = screenStream.getVideoTracks()[0];
            console.log('screenStreamVideoTrack', screenStreamVideoTrack);
        }

        zg.replaceTrack(previewVideo.srcObject, screenStreamVideoTrack)
            .then(res => {
                console.warn('replaceTrack success');
                videoType = 'external';
            })
            .catch(err => console.error(err));
    });

    zg.off('roomStreamUpdate');
    zg.on('roomStreamUpdate', async (roomID, updateType, streamList, extendedData) => {
        console.log('roomStreamUpdate 2 roomID ', roomID, streamList, extendedData);
        if (updateType == 'ADD') {
            for (let i = 0; i < streamList.length; i++) {
                console.info(streamList[i].streamID + ' was added');
                let remoteStream;
                remoteStreamID = streamList[i].streamID
                const handlePlaySuccess = (streamItem) => {
                    let video;
                    const bro = getBrowser();
                    if (bro == 'Safari' && playOption.video === false) {
                        $('.remoteVideo').append($(`<audio id=${streamItem.streamID} autoplay muted playsinline controls></audio>`));
                        video = $('.remoteVideo audio:last')[0];
                        console.warn('audio', video, remoteStream);
                    } else {
                        $('.remoteVideo').append($(`<video id=${streamItem.streamID} autoplay muted playsinline controls></video>`));
                        video = $('.remoteVideo video:last')[0];
                        console.warn('video', video, remoteStream);
                    }

                    video.srcObject = remoteStream;
                    video.muted = false;
                };

                playOption = {};
                const _selectMode = $('#playMode option:selected').val();
                console.warn('playMode', _selectMode, playOption);
                if (_selectMode) {
                    if (_selectMode == 'all') {
                        playOption.video = true;
                        playOption.audio = true;
                    } else if (_selectMode == 'video') {
                        playOption.audio = false;
                    } else if (_selectMode == 'audio') {
                        playOption.video = false;
                    }
                }

                if ($("#videoCodec").val()) playOption.videoCodec = $("#videoCodec").val();
                if (l3 == true) playOption.resourceMode = 2;

                zg.startPlayingStream(streamList[i].streamID, playOption).then(stream => {
                    remoteStream = stream;
                    useLocalStreamList.push(streamList[i]);
                    handlePlaySuccess(streamList[i]);
                }).catch(error => {
                    console.error(error);

                })
            }
        } else if (updateType == 'DELETE') {
            for (let k = 0; k < useLocalStreamList.length; k++) {
                for (let j = 0; j < streamList.length; j++) {
                    if (useLocalStreamList[k].streamID === streamList[j].streamID) {
                        try {
                            zg.stopPlayingStream(useLocalStreamList[k].streamID);
                        } catch (error) {
                            console.error(error);
                        }

                        console.info(useLocalStreamList[k].streamID + 'was devared');


                        $('.remoteVideo video:eq(' + k + ')').remove();
                        useLocalStreamList.splice(k--, 1);
                        break;
                    }
                }
            }
        }
    });
    zg.on("roomStateUpdate", (roomID, state) => {
        if (state === "DISCONNECTED") {
            if (cameraStreamVideoTrack) {
                cameraStreamVideoTrack.stop();
                cameraStreamVideoTrack = null;
            }
            if (screenStream) {
                zg.destroyStream(screenStream)
                screenStream = null
            }
            if (externalStream) {
                zg.destroyStream(externalStream)
                externalStream = null
            }
        }
    })
});