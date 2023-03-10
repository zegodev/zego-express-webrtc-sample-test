
import { checkAnRun, enterRoom, push, previewVideo, isPreviewed, zg, publishStreamId, sei } from '../common';

$(async () => {
    await checkAnRun();
    $('#changeUrl').click(async () => {
        if ($('#videoUrl').val()) {
            $('#externerVideo')[0].src = $('#videoUrl').val();
            $('#externerVideo')[0].play();
        }

    })
    $('#externalCaptureV').click(async () => {
        let loginSuc = false;
        const channelCount = parseInt($('#channelCount').val());

        let media = await changeStream($('#externerVideo')[0]);

        const constraints = {
            custom: {
                source: media,
                channelCount: channelCount,
                videoOptimizationMode: $('#videoOptimizationMode').val() ? $('#videoOptimizationMode').val() : "default",
                minBitrate: $('#minbitrate').val() && parseInt($('#minbitrate').val()),
                keyFrameInterval: $('#gop').val() && parseInt($('#gop').val())
            }
        }
        $('#audioBitrate').val() && (constraints.audioBitrate = parseInt($('#audioBitrate').val()));

        try {
            // $('#externerVideo')[0].play();
            loginSuc = await enterRoom();

            if (loginSuc) {
                doPreviewPublish(constraints, publishStreamId);

            }
        } catch (error) {
            console.error(error);
        }
    });
    $('#externalCaptureA').click(async () => {
        let loginSuc = false;
        const channelCount = parseInt($('#channelCount').val());

        const constraints = {
            custom: {
                source: $('#externerAudio')[0],
                channelCount: channelCount,
            }
        }

        $('#audioBitrate').val() && (constraints.audioBitrate = parseInt($('#audioBitrate').val()));

        try {
            loginSuc = await enterRoom();
            if (loginSuc) {

                doPreviewPublish(constraints, publishStreamId);
            }
        } catch (error) {
            console.error(error);
        }
    });

    $('#inputFile').change(function () {
        const video = this.files[0];
        const url = URL.createObjectURL(video);
        $('#externerVideo')[0].src = url;
    })
    async function doPreviewPublish(config, streamID) {
        console.log('doPreviewPublish', config);
        zg.createStream(config).then(stream => {
            previewVideo.srcObject = stream;
            
            zg.startPublishingStream(streamID ? streamID : idName, stream, { 
                videoCodec: $('#videoCodeType').val(), extraInfo: JSON.stringify({ role: 2 }), 
                isSEIStart: sei, 
                extraInfo: `{"range_audio_team_id":"t11","range_audio_mode":1}`
            })

        }).catch(err => {
            console.error(err)
        })
    }
    //?????????????????????  ???????????????88 ??????
    function getChromeVersion() {
        var arr = navigator.userAgent.split(' ');
        var chromeVersion = '';
        for (var i = 0; i < arr.length; i++) {
            if (/chrome/i.test(arr[i]))
                chromeVersion = arr[i]
        }
        if (chromeVersion) {
            return Number(chromeVersion.split('/')[1].split('.')[0]);
        } else {
            return false;
        }
    }

    function changeStream(source) {

        var version = getChromeVersion();
        if (version != 88) {
            return source
        }
        return zg.createStream({
            custom: {
                source: source,
                videoOptimizationMode: $('#videoOptimizationMode').val() ? $('#videoOptimizationMode').val() : "default",
                minBitrate: $('#minbitrate').val() && parseInt($('#minbitrate').val()),
                keyFrameInterval: $('#gop').val() && parseInt($('#gop').val())
            }
        }).then(stream => {
            let video = document.createElement("video");
            let canvas = document.createElement("canvas");
            video.setAttribute("style", "display:none");
            canvas.setAttribute("style", "display:none");
            video.setAttribute("muted", "");
            video.muted = !0;
            video.setAttribute("autoplay", "");
            video.autoplay = !0;
            video.setAttribute("playsinline", "");
            document.body.append(video);
            document.body.append(canvas);
            video.srcObject = stream;
            video.oncanplay = function () {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                video.play();
                draw();
            }

            let media = canvas.captureStream(25);
            let track = media.getVideoTracks()[0];
            let ctx = canvas.getContext("2d");
            let draw = function () {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                // window.requestAnimationFrame(draw)
                track.requestFrame && track.requestFrame();
                video.srcObject = stream;

            }
            let q = track.stop
            track.stop = () => {
                q.call(track);
                draw();
                video.remove();
                canvas.width = 0;
                canvas.remove();
                video = canvas = null;
            }
            if (stream instanceof MediaStream && stream.getAudioTracks().length) {
                let micro = stream.getAudioTracks()[0];
                media.addTrack(micro)
            }
            return media
        }).catch(err => {
            console.error(err)
        })
    }

});
