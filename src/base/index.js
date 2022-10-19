import {
    checkAnRun, zg, useLocalStreamList, startPreview, enterRoom,
    previewVideo, login2, getToken, clear, logout,
    publish, publishStreamId, l3, enumDevices, userID, sei,
    bindViewCtrl
} from '../common';
import { getBrowser } from '../assets/utils';

let playOption = {};
// --test begin
let previewStream;
let cameraStreamVideoTrack;
let externalStream;
let externalStreamVideoTrack;
let published = false;
let remoteStreamID = ""
// ---test end
let screenStreamVideoTrack;
let screenStream;
let playstreamlist;
let videoType
// let loginTime

$(async () => {
    await checkAnRun();

    $("#resumeAutoplay").hide()
    // // TODO: 测试临时设置
    // $("#playMode").val("all")
    $("#enableDualStream").val(0)
    function play(streamID) {
        let remoteStream;
        remoteStreamID = streamID;
        const handlePlaySuccess = (streamItem, stream) => {
            if (zg.getVersion() > "2.17.0") {
                const id = streamItem.streamID;
                $(".remoteVideo").append(
                    $(`
                    <div class="view-wrapper" id="wrap${id}" style="display:inline-block;width: 240px; border: 1px solid #dfdfdf; font-size: 12px;">
                      <div id="${id}"  style="min-width: 240px;width: 240px; height: 240px;"></div>
                      <div id="local-action">
                        <button id="local-ctrl-audio${id}">开关声音</button>
                        <button id="local-ctrl-video${id}">开关视频</button>
                        <button id="local-ctrl-resume${id}">恢复</button>
                        <button id="local-ctrl-play${id}">挂载</button>
                        <button id="local-ctrl-stop${id}">卸载</button>
                        <button id="local-ctrl-speaker${id}">设扬声器</button>
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
                const handle = () => {
                    viewer && viewer.resume()
                    $("#resumeAutoplay").hide();
                }
                viewer.on("autoplayFailed", () => {
                    console.error('autoplayFailed2', id);
                    $("#resumeAutoplay").show();
                    $("#resumeAutoplay").on("click", handle)
                })
            } else {
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
            }
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

        zg.startPlayingStream(streamID, playOption).then(stream => {
            remoteStream = stream;
            useLocalStreamList.push({ streamID });
            handlePlaySuccess({ streamID }, stream);
        }).catch(error => {
            console.error(error);

        })
    }

    // --- test begin
    $('#publish').click(() => {
        const publishStreamID = publishStreamId || 'web-' + new Date().getTime();
        const stream = $('#publish-stream').val();
        // !cameraStreamVideoTrack && previewVideo.srcObject && (cameraStreamVideoTrack = previewStream.getVideoTracks()[0] && previewStream.getVideoTracks()[0].clone());
        window.publishTime = new Date().getTime();
        const result = zg.startPublishingStream(stream || publishStreamID, previewStream ? previewStream : previewVideo.srcObject, { roomID: $('#roomId').val(), isSEIStart: sei });
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
    $("#publishImg").on("click", () => {
        zg.setDummyCaptureImagePath("./test.jpg", previewVideo.srcObject);
    });
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
            $('#width').val() && (constraints.width = parseInt($('#width').val()) || JSON.parse($('#width').val())),
                $('#height').val() && (constraints.height = parseInt($('#height').val()) || JSON.parse($('#height').val())),
                $('#frameRate').val() && (constraints.frameRate = parseInt($('#frameRate').val()) || JSON.parse($('#frameRate').val())),
                $('#bitrate').val() && (constraints.bitrate = parseInt($('#bitrate').val()))
        }
        $('#noiseSuppression').val() === '1' ? (constraints.ANS = true) : (constraints.ANS = false);
        $('#autoGainControl').val() === '1' ? (constraints.AGC = true) : (constraints.AGC = false);
        $('#echoCancellation').val() === '1' ? (constraints.AEC = true) : (constraints.AEC = false);
        $('#audioBitrate').val() && (constraints.audioBitrate = parseInt($('#audioBitrate').val()));

        // 最小码率
        $('#minbitrate').val() && (constraints.minBitrate = parseInt($('#minbitrate').val()))
        $('#gop').val() && (constraints.keyFrameInterval = parseInt($('#gop').val()))
        constraints.videoQuality = parseInt(videoQuality);
        console.warn('constraints', constraints);
        try {
            // loginSuc = await enterRoom();
            // loginSuc && (await publish({ camera: constraints }));

            loginSuc = await enterRoom();

            loginSuc && (await publish({ camera: constraints }, true));

        } catch (error) {
            console.error(error);
        }
    });
    $('#openRoom').unbind('click');
    $('#openRoom').click(async () => {
        await enterRoom();
    });
    $('#openRoomPlay').click(async () => {
        const roomId = $('#roomId').val();
        if (!roomId) {
            alert('roomId is empty');
            return false;
        }
        const token = await getToken(userID, roomId);
        login2(token, roomId).then(res => {
            console.warn('登录成功');
        }).catch(e => {
            console.warn('登录失败');
        })
        const playStreamIDs = $('#playStreamID').val();
        if (!playStreamIDs) {
            alert('streamId is empty');
            return false;
        }
        playstreamlist = playStreamIDs.split(';');
        playstreamlist.forEach(stream => {
            play(stream);
        })
    });
    $('#enterRoom').unbind('click');
    $('#enterRoom').click(async () => {
        let loginSuc = false;
        try {
            loginSuc = await enterRoom();
            const currentRoomID = $('#roomId').val()
            if (loginSuc) {
                const constraints = {};
                const channelCount = parseInt($('#channelCount').val());
                constraints.channelCount = channelCount;
                const videoQuality = $('#videoQuality').val();
                if (videoQuality == 4) {
                    $('#width').val() && (constraints.width = parseInt($('#width').val()) || JSON.parse($('#width').val())),
                        $('#height').val() && (constraints.height = parseInt($('#height').val()) || JSON.parse($('#height').val())),
                        $('#frameRate').val() && (constraints.frameRate = parseInt($('#frameRate').val()) || JSON.parse($('#frameRate').val())),
                        $('#bitrate').val() && (constraints.bitrate = parseInt($('#bitrate').val()))
                }
                $('#noiseSuppression').val() === '1' ? (constraints.ANS = true) : (constraints.ANS = false);
                $('#autoGainControl').val() === '1' ? (constraints.AGC = true) : (constraints.AGC = false);
                $('#echoCancellation').val() === '1' ? (constraints.AEC = true) : (constraints.AEC = false);
                $('#audioBitrate').val() && (constraints.audioBitrate = parseInt($('#audioBitrate').val()));

                // 最小码率
                $('#minbitrate').val() && (constraints.minBitrate = parseInt($('#minbitrate').val()))
                $('#gop').val() && (constraints.keyFrameInterval = parseInt($('#gop').val()))
                constraints.videoQuality = parseInt(videoQuality);
                console.warn('constraints', constraints);
                startPreview({ camera: constraints })
            }
        } catch (error) {
            console.error(error);
        }
    });
    $('#extraInfo').click(() => {
        zg.setStreamExtraInfo(publishStreamId, $('#extraInfoInput').val());
    });
    $('#switchConstraints').click(() => {
        const constraints = {};
        const w = $('#width').val() ? (parseInt($('#width').val()) ? parseInt($('#width').val()) : JSON.parse($('#width').val())) : 0;
        const h = $('#height').val() ? (parseInt($('#height').val()) ? parseInt($('#height').val()) : JSON.parse($('#height').val())) : 0;
        const f = $('#frameRate').val() ? (parseInt($('#frameRate').val()) ? parseInt($('#frameRate').val()) : JSON.parse($('#frameRate').val())) : 0;
        const b = $('#bitrate').val() ? parseInt($('#bitrate').val()) : 0;
        const videoQuality = $('#videoQuality').val();

        w && Object.assign(constraints, { width: w });
        h && Object.assign(constraints, { height: h });
        f && Object.assign(constraints, { frameRate: f });
        b && Object.assign(constraints, { maxBitrate: b });
        videoQuality && Object.assign(constraints, { videoQuality: parseInt(videoQuality) });

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

    $('#mutePlayStreamVideo').click(function () {
        useLocalStreamList.forEach(item => {
            zg.mutePlayStreamVideo(item.streamID, !$(this).hasClass('disabled'));
        })
        $(this).toggleClass('disabled');
    })
    $('#mutePlayStreamAudio').click(function () {
        useLocalStreamList.forEach(item => {
            zg.mutePlayStreamAudio(item.streamID, !$(this).hasClass('disabled'));
        })
        $(this).toggleClass('disabled');
    })

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

    $('#toggleMicrophone').click(function () {
        zg.muteMicrophone(!$(this).hasClass('disabled'));
        $(this).toggleClass('disabled');
    });

    let isBeauty = false
    async function setBeautyEffect(enable) {
        if (enable === undefined) {
            enable = isBeauty
        }

        // 设置美颜之前保存摄像头视轨
        !cameraStreamVideoTrack && previewVideo.srcObject && (cameraStreamVideoTrack = previewVideo.srcObject.getVideoTracks()[0] && previewVideo.srcObject.getVideoTracks()[0]);
        const beautyConfig = {
            sharpenIntensity: parseInt($("#range-sharp").val()),
            whitenIntensity: parseInt($("#range-light").val()),
            rosyIntensity: parseInt($("#range-red").val()),
            smoothIntensity: parseInt($("#range-blur").val()),
            // lowlightEnhancement: $("#range-lowlight")[0].checked
        }
        const res = await zg.setEffectsBeauty(
            $("#previewVideo")[0].srcObject,
            enable, beautyConfig
        );
        isBeauty = enable
        console.warn("setBeautyEffect", res, beautyConfig);
    }

    let aidenise = false; // 是否开启了ai降噪
    $("#switchAiDenoise").on("click", async () => {
        const localPublishStream = $("#previewVideo")[0].srcObject;
        if (aidenise) {
            if (!localPublishStream) {
                alert('流不存在！');
                return;
            }
            const switchAiDenoiseBtn = document.getElementById('switchAiDenoise');
            if (switchAiDenoiseBtn) {
                switchAiDenoiseBtn.innerText = '开启ai降噪';
            }
            aidenise = false;
            await zg.enableAiDenoise(localPublishStream, false);
        } else {
            if (!localPublishStream) {
                alert('流不存在！');
                return;
            }
            const switchAiDenoiseBtn = document.getElementById('switchAiDenoise');
            if (switchAiDenoiseBtn) {
                switchAiDenoiseBtn.innerText = '关闭ai降噪';
            }
            aidenise = true;
            await zg.enableAiDenoise(localPublishStream, true);
        }
    });

    $("#range-sharp").on("change", () => { setBeautyEffect(isBeauty) })
    $("#range-light").on("change", () => { setBeautyEffect(isBeauty) })
    $("#range-red").on("change", () => { setBeautyEffect(isBeauty) })
    $("#range-blur").on("change", () => { setBeautyEffect(isBeauty) })
    $("#range-lowlight").on("change", () => {
        const mode = $("#range-lowlight")[0].checked ? 1 : 0;
        zg.setLowlightEnhancement($("#previewVideo")[0].srcObject, mode);
        console.warn("setLowlightEnhancement", mode);
    })

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
        !cameraStreamVideoTrack && previewVideo.srcObject && (cameraStreamVideoTrack = previewVideo.srcObject.getVideoTracks()[0]);

        zg.replaceTrack(previewVideo.srcObject, cameraStreamVideoTrack)
            .then(res => {
                console.warn('replaceTrack success');
                videoType = 'camera';
            })
            .catch(err => console.error(err));
    });
    $('#replaceScreenVideo').click(async function () {
        if (!previewVideo.srcObject) {
            alert('流不存在');
            return;
        }
        // 设置美颜之前保存摄像头视轨
        !cameraStreamVideoTrack && previewVideo.srcObject && (cameraStreamVideoTrack = previewVideo.srcObject.getVideoTracks()[0] && previewVideo.srcObject.getVideoTracks()[0]);
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

    (document.querySelector("#addTrack")).addEventListener(
        "click",
        async e => {
            const stream = await zg.createStream();
            if (cameraStreamVideoTrack) cameraStreamVideoTrack.stop()
            cameraStreamVideoTrack = stream.getVideoTracks()[0]
            //@ts-ignore
            const result = await zg.zegoWebRTC.addTrack(
                previewVideo.srcObject,
                cameraStreamVideoTrack
            );

            console.error(result);
        }
    );

    (document.querySelector(
        "#removeTrack"
    )).addEventListener("click", async e => {
        //@ts-ignore
        const result = await zg.zegoWebRTC.removeTrack(
            //@ts-ignore
            previewVideo.srcObject,
            //@ts-ignore
            previewVideo.srcObject.getVideoTracks()[0]
        );
        console.error(result);
    });

    function setExtendModelData(inputElement) {
        const exact = parseInt(document.querySelector('#exact').value);
        const ideal = parseInt(document.querySelector('#ideal').value);
        const max = parseInt(document.querySelector('#max').value);
        const min = parseInt(document.querySelector('#min').value);
        const obj = {};
        if (!isNaN(exact)) {
            obj.exact = exact;
        }
        if (!isNaN(ideal)) {
            obj.ideal = ideal;
        }
        if (!isNaN(max)) {
            obj.max = max;
        }
        if (!isNaN(min)) {
            obj.min = min;
        }
        inputElement.value = JSON.stringify(obj)
    }
    function clearExtendModelData() {
        document.querySelector('#exact').value = '';
        document.querySelector('#ideal').value = '';
        document.querySelector('#max').value = '';
        document.querySelector('#min').value = '';
    }
    document.querySelector('#widthExtendButton').addEventListener('click', e => {
        clearExtendModelData();
        document.querySelector('#extendOK').onclick = e => {
            setExtendModelData(document.querySelector('#width'));
        };
    })
    document.querySelector('#heightExtendButton').addEventListener('click', e => {
        clearExtendModelData();
        document.querySelector('#extendOK').onclick = e => {
            setExtendModelData(document.querySelector('#height'));
        };
    })
    document.querySelector('#frameRateExtendButton').addEventListener('click', e => {
        clearExtendModelData();
        document.querySelector('#extendOK').onclick = e => {
            setExtendModelData(document.querySelector('#frameRate'));
        };
    })

    $('#replaceExternalVideo').click(async function () {
        console.error("1111111");
        if (!previewVideo.srcObject) {
            alert('流不存在');
            return;
        }
        // 优先保存摄像头视轨
        !cameraStreamVideoTrack && previewVideo.srcObject && (cameraStreamVideoTrack = previewVideo.srcObject.getVideoTracks()[0] && previewVideo.srcObject.getVideoTracks()[0]);
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
                // videoType = 'external';
            })
            .catch(err => console.error(err));
    });
    zg.off('roomStreamUpdate');
    zg.on('roomStreamUpdate', async (roomID, updateType, streamList, extendedData) => {
        console.warn('roomStreamUpdate 2 roomID ', roomID, updateType, streamList, extendedData);
        if (updateType == 'ADD') {
            for (let i = 0; i < streamList.length; i++) {
                console.info(streamList[i].streamID + ' was added');

                if (playstreamlist && playstreamlist.find(streamid => streamid === streamList[i].streamID)) {
                    console.warn('流已手动拉', streamList[i].streamID);
                    continue;
                }

                const streamItem = useLocalStreamList.find(stream => stream.streamID === streamList[i].streamID);

                if (streamItem) {
                    console.warn('流已在拉');
                    continue;
                }

                let remoteStream;
                remoteStreamID = streamList[i].streamID
                const handlePlaySuccess = (streamItem) => {
                    if (zg.getVersion() >= "2.17.0") {
                        const id = streamItem.streamID
                        $(".remoteVideo").append(
                            $(`
                            <div class="view-wrapper" id="wrap${id}" style="display:inline-block;width: 240px; border: 1px solid #dfdfdf; font-size: 12px;">
                              <div id="${id}"  style="min-width: 240px;width: 240px; height: 240px;"></div>
                              <div id="local-action">
                                <button id="local-ctrl-audio${id}">开关声音</button>
                                <button id="local-ctrl-video${id}">开关视频</button>
                                <button id="local-ctrl-resume${id}">恢复</button>
                                <button id="local-ctrl-play${id}">挂载</button>
                                <button id="local-ctrl-stop${id}">卸载</button>
                                <button id="local-ctrl-speaker${id}">设扬声器</button>
                                <input id="local-ctrl-volume${id}" type="range" min="0" max="100" value="100" id="audioVolume1">
                                <span id="local-ctrl-audio-state${id}"></span>
                                <span id="local-ctrl-video-state${id}"></span>
                              </div>
                            </div>`
                            )
                        );
                        const viewer = zg.createRemoteStreamView(remoteStream);
                        bindViewCtrl(viewer, id);
                        console.warn('enable-dialog', $("#enable-dialog").val() != "0");
                        viewer.play(id, { enableAutoplayDialog: $("#enable-dialog").val() != "0" });
                        const handle = () => {
                            viewer && viewer.resume()
                            $("#resumeAutoplay").hide();
                        }
                        viewer.on("autoplayFailed", () => {
                            console.error('autoplayFailed1', id);
                            $("#resumeAutoplay").show();
                            $("#resumeAutoplay").on("click", handle)
                        })
                    } else {
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
                    }
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
                playOption.isSEIStart = sei;
                playOption.streamType = $('#streamType').val() == "0" ? 0 : $('#streamType').val() == "1" ? 1 : 2;

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

                        playstreamlist = playstreamlist && playstreamlist.filter(item => item !== streamList[j].streamID);
                        console.warn('playstreamlist', playstreamlist)
                        console.info(useLocalStreamList[k].streamID + 'was devared');

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
            playstreamlist = null;
            clear()
        }
    })
    zg.off('publisherStateUpdate')
    zg.on('publisherStateUpdate', result => {
        console.warn('publisherStateUpdate: ', result.streamID, result.state, result);
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
        }
    })
    zg.off('playQualityUpdate')
    zg.on('playQualityUpdate', (streamID, stats) => {
        const { audio, video } = stats;
        console.info("videoBreakUpdate ", new Date(), {
            videoCumulativeDecodeTime: video.videoCumulativeDecodeTime,
            videoCumulativeBreakTime: video.videoCumulativeBreakTime,
            videoCumulativeBreakRate: video.videoCumulativeBreakRate,
            videoCumulativeBlankTime: video.videoCumulativeBlankTime
        });
        console.info("audioBreakUpdate ", new Date(), {
            audioCumulativeDecodeTime: audio.audioCumulativeDecodeTime,
            audioCumulativeBreakTime: audio.audioCumulativeBreakTime,
            audioCumulativeBreakRate: audio.audioCumulativeBreakRate,
            audioCumulativeBlankTime: audio.audioCumulativeBlankTime
        });
    })
});

