from flask import Blueprint, jsonify, request, send_file
import json
import os
from pathlib import Path

validation_bp = Blueprint('validation', __name__)

VALIDATION_RESULTS_DIR = Path('/home/maiordba/projects/vision/Wan2.2/lora_finetuning/validation_results')

@validation_bp.route('/api/validation/json-errors', methods=['GET'])
def get_json_errors():
    """JSON 오류 파일 목록 반환"""
    try:
        report_path = VALIDATION_RESULTS_DIR / 'syntactic_accuracy' / 'syntactic_accuracy_report.json'

        if not report_path.exists():
            return jsonify({'error': 'Validation report not found'}), 404

        with open(report_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        json_metadata = data['detailed_results']['json_metadata']

        # 스키마 오류
        schema_errors = json_metadata.get('schema_errors', [])

        # 파싱 오류
        parse_errors = json_metadata.get('parse_errors', [])

        return jsonify({
            'total': len(schema_errors) + len(parse_errors),
            'schema_errors': schema_errors,
            'parse_errors': parse_errors
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@validation_bp.route('/api/validation/json-content/<clip_id>', methods=['GET'])
def get_json_content(clip_id):
    """특정 clip_id의 JSON 파일 내용 반환"""
    try:
        # CSV에서 파일 경로 찾기
        csv_path = '/home/maiordba/projects/vision/Wan2.2/preprocessed_data/all_train.csv'

        import csv
        file_path = None
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row['clip_id'] == clip_id:
                    file_path = row['file_path']
                    break

        if not file_path:
            return jsonify({'error': 'clip_id not found in CSV'}), 404

        # JSON 파일 경로
        json_path = file_path.replace('.mp4', '.json').replace('.png', '.json').replace('.jpg', '.json')

        if not os.path.exists(json_path):
            return jsonify({'error': 'JSON file not found', 'path': json_path}), 404

        # JSON 파일 읽기
        with open(json_path, 'r', encoding='utf-8') as f:
            json_data = json.load(f)

        return jsonify({
            'clip_id': clip_id,
            'file_path': file_path,
            'json_path': json_path,
            'content': json_data
        })

    except json.JSONDecodeError as e:
        return jsonify({
            'error': 'JSON parse error',
            'message': str(e),
            'clip_id': clip_id
        }), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@validation_bp.route('/api/validation/summary', methods=['GET'])
def get_validation_summary():
    """전체 검증 결과 요약 반환"""
    try:
        summaries = {}

        # 각 검증 결과 읽기
        validation_types = [
            'formality',
            'diversity_requirements',
            'diversity_statistical',
            'syntactic_accuracy'
        ]

        for val_type in validation_types:
            report_path = VALIDATION_RESULTS_DIR / val_type / f'{val_type}_report.json'

            if report_path.exists():
                with open(report_path, 'r', encoding='utf-8') as f:
                    summaries[val_type] = json.load(f)

        return jsonify(summaries)

    except Exception as e:
        return jsonify({'error': str(e)}), 500
