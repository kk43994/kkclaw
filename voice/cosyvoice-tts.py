#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DashScope CosyVoice TTS 命令行工具
用法: python cosyvoice-tts.py "要合成的文本" -o output.mp3 -v longxiaochun
"""

import sys
import os
import argparse

def main():
    parser = argparse.ArgumentParser(description='CosyVoice TTS')
    parser.add_argument('text', help='要合成的文本')
    parser.add_argument('-o', '--output', default='cosyvoice_output.mp3', help='输出文件路径')
    parser.add_argument('-v', '--voice', default='cosyvoice-v3-plus-tuantuan-28c7ca7e915943a081ab7ece12916d28', help='音色名称')
    parser.add_argument('-m', '--model', default='cosyvoice-v3-plus', help='模型名称')
    parser.add_argument('-k', '--api-key', default=None, help='DashScope API Key')
    parser.add_argument('-r', '--speech-rate', type=float, default=1.1, help='语速 (0.5~2.0, 默认1.1)')
    parser.add_argument('--list-voices', action='store_true', help='列出可用音色')
    
    args = parser.parse_args()
    
    if args.list_voices:
        voices = {
            'longxiaochun': '龙小淳 - 甜美温柔女声（推荐）',
            'longxiaoxia': '龙小夏 - 活泼元气女声',
            'longxiaobai': '龙小白 - 知性优雅女声',
            'longshu': '龙姝 - 温婉女声',
            'longwan': '龙婉 - 甜蜜女声',
            'longtong': '龙彤 - 萝莉女声',
            'longshuo': '龙硕 - 稳重男声',
            'longjing': '龙镜 - 播音男声',
            'longfei': '龙飞 - 激昂男声',
            'longyue': '龙悦 - 温暖男声',
            'longxiang': '龙翔 - 少年男声',
        }
        for name, desc in voices.items():
            print(f"  {name:20s} {desc}")
        return
    
    # API Key
    api_key = args.api_key or os.environ.get('DASHSCOPE_API_KEY', '')
    if not api_key:
        # 尝试从 pet-config.json 读取
        try:
            import json
            config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pet-config.json')
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            api_key = config.get('dashscope', {}).get('apiKey', '')
        except Exception:
            pass
    
    if not api_key:
        print("ERROR: DashScope API Key 未设置", file=sys.stderr)
        sys.exit(1)
    
    try:
        import dashscope
        dashscope.api_key = api_key
        from dashscope.audio.tts_v2 import SpeechSynthesizer
    except ImportError:
        print("ERROR: 请安装 dashscope: pip install dashscope", file=sys.stderr)
        sys.exit(1)
    
    # 合成
    text = args.text.strip()
    if not text:
        print("ERROR: 文本为空", file=sys.stderr)
        sys.exit(1)
    
    # 截断过长文本
    if len(text) > 500:
        text = text[:500]
        print(f"WARNING: 文本过长，截断到500字符", file=sys.stderr)
    
    try:
        synthesizer = SpeechSynthesizer(model=args.model, voice=args.voice, speech_rate=args.speech_rate)
        audio = synthesizer.call(text)
        
        if not audio or len(audio) < 100:
            print("ERROR: 合成结果为空", file=sys.stderr)
            sys.exit(1)
        
        # 确保输出目录存在
        output_dir = os.path.dirname(os.path.abspath(args.output))
        os.makedirs(output_dir, exist_ok=True)
        
        with open(args.output, 'wb') as f:
            f.write(audio)
        
        # 输出文件路径（供 Node.js 捕获）
        print(os.path.abspath(args.output))
        
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
