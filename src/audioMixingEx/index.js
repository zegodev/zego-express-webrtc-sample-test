import { checkAnRun, zg, publishStreamId, logout, effectPlayer} from '../common';

$(async () => {
    let isMixingAudio = false;
    let isMixingBuffer = false;
    let effectId = $("#effectId").val()
    const audioEffectList = [
        {
            effectId: '1',
            path: 'https://zego-public.oss-cn-shanghai.aliyuncs.com/sdk-doc/assets/station.mp3',
        },
        {
            effectId: '2',
            path: 'https://storage.zego.im/demo/oldman.m4a',
        },
        {
            effectId: '3',
            path: 'https://storage.zego.im/demo/tonight.m4a',
        }
    ];
    await checkAnRun();
    $('#MixAudio').click(() => {
        const result = zg.startMixingAudio(publishStreamId, [
            $('#extenerVideo1')[0] ,
            $('#extenerVideo2')[0] ,
        ]);
        console.warn('混音', result);
    });

    $('#stopMixAudio').click(() => {
        zg.stopMixingAudio(publishStreamId);
    });

    $('#volume1').on('input', () => {
        // @ts-ignore
        zg.setMixingAudioVolume(publishStreamId, parseInt($('#volume1').val()), $(
            '#extenerVideo1',
        )[0] );
    });

    $('#volume2').on('input', () => {
        // @ts-ignore
        zg.setMixingAudioVolume(publishStreamId, parseInt($('#volume2').val()), $(
            '#extenerVideo2',
        )[0] );
    });

    $('#mixingBuffer').click(function() {
        const xhr = new XMLHttpRequest();

        xhr.open('GET', 'https://storage.zego.im/demo/tonight.m4a', true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = () => {
            if (xhr.status == 200 || xhr.status == 304) {
                const buffer = xhr.response;
                zg.zegoWebRTC.mixingBuffer(publishStreamId, '1', buffer, (err) => {
                    if (err) {
                        console.error(err);
                    } else {
                        isMixingBuffer = true;
                        console.warn('real time effect success');
                    }
                });
            }
        };

        xhr.send();
    });

    $('#stopMixingBuffer').click(function() {
        zg.zegoWebRTC.stopMixingBuffer(publishStreamId, '1');
    });

    $('#leaveMixRoom').click(function() {
        isMixingAudio && zg.stopMixingAudio(publishStreamId);
        isMixingBuffer && zg.zegoWebRTC.stopMixingBuffer(publishStreamId, '1');
        isMixingAudio = false; 
        isMixingBuffer = false;
        logout();
    });

    $('#preloadEffect').click(async ()=> {
        await Promise.all(audioEffectList.map(async effect=>{
            const res = await zg.preloadAudioEffect(effect.effectId, effect.path)
            console.warn('preload success '  + res);   
            return res
        }))

        $('#playEffect')[0].disabled = false;
        
        $('#unloadEffect')[0].disabled = false;
    });

    $('#playEffect').click(() => {
        if(!effectId) {
            alert("需要指定播放音效id")
        }
        // if(!effectPlayer) {
        //     effectPlayer = zg.createAudioEffectPlayer(document.querySelector("#previewVideo").srcObject)
        // }
        const id = effectId
        effectPlayer.start(
            id,
            () => {
                isMixingAudio = true;
                
                $('#pauseEffect')[0].disabled = false;
                 
                $('#resumeEffect')[0].disabled = false;
                
                $('#stopEffect')[0].disabled = false;
                console.warn('start play');
            },
            () => {
                isMixingAudio = false;
                alert("音效播放结束 "+ id)
                // $('#pauseEffect')[0].disabled = true;
                
                // $('#resumeEffect')[0].disabled = true;
                
                // $('#stopEffect')[0].disabled = true;
                console.warn('play end'+ id);
            },
        );
    });

    $('#pauseEffect').click(() => {
        effectPlayer.pause(effectId);
    });

    $('#resumeEffect').click(() => {
        effectPlayer.resume(effectId);
    });

    $('#stopEffect').click(() => {
        effectPlayer.stop(effectId);
        if(!effectId) {

            $('#pauseEffect')[0].disabled = true;
        
            $('#resumeEffect')[0].disabled = true;
            
            $('#stopEffect')[0].disabled = true;
        }
    });
    $("#seekTo").click(() => {
        if(!effectId) {
            alert("no effectId")
        }
        const total = effectPlayer.getTotalDuration(effectId)
        const origin = effectPlayer.getCurrentProgress(effectId)
        const progress = (($("#progress").val()||0)/100) * total
        
        effectPlayer.seekTo(effectId, progress);
        alert(`总时长：${total},指定位置：${progress}, 原位置：${origin}`)
    });

    $('#unloadEffect').click(() => {
        let num = 0;
        audioEffectList.forEach(effect => {
            zg.zegoWebRTC.unloadEffect(effect.effectId) && num++;
        });

        if (num === audioEffectList.length) {
            console.warn('all unload success');
            
            $('#playEffect')[0].disabled = true;
            
            $('#unloadEffect')[0].disabled = true;
        }
    });
    $("#effectId").change(()=>{
        effectId = $("#effectId").val()
    })
});
