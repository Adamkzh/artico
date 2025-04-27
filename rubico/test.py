



from gpt.tts_client import synthesize_speech
from utils.s3Server import upload_file_and_get_presigned_url


def test_synthesize_speech():
    input_text = '''
    《维纳斯的诞生》是意大利文艺复兴时期画家桑德罗·波提切利最著名的作品之一，这件作品根据波利齐安诺的长诗《吉奥斯特纳》而作，描述罗马神话中女神维纳斯从海中诞生的情景：她赤裸著身子踩在一个贝壳之上，右边春之女神正在为她披上华服而左边的风神送来暖风阵风，吹起她的发丝。《维纳斯的诞生》目前收藏在佛罗伦萨的乌菲兹美术馆中。
    '''
    audio_bytes = synthesize_speech(input_text, 'mock_session_id')
    presigned_url = upload_file_and_get_presigned_url(audio_bytes, 'mock_session_id')
    
    return presigned_url