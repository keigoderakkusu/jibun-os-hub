"""
upload_drive.py
生成したPDFファイルをGoogle Driveの指定フォルダにアップロードする
jibun-os-hub/reports/ に配置して使用する
"""

import os
import json
import glob
from datetime import datetime
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google.oauth2.service_account import Credentials


def main():
    # 環境変数から設定取得
    # jibun-os-hub では GOOGLE_CREDENTIALS_JSON という名前で統一
    service_account_json = os.environ.get(
        "GOOGLE_SERVICE_ACCOUNT_JSON",
        os.environ.get("GOOGLE_CREDENTIALS_JSON", "")
    )
    if not service_account_json:
        raise ValueError("GOOGLE_SERVICE_ACCOUNT_JSON または GOOGLE_CREDENTIALS_JSON が未設定です")

    folder_id = os.environ["DRIVE_FOLDER_ID"]

    # 最新のPDFファイルを探す（LibreOfficeで変換済み）
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, "output")
    files = sorted(glob.glob(os.path.join(output_dir, "*.pdf")))

    if not files:
        raise FileNotFoundError(
            f"{output_dir}/*.pdf が見つかりません。"
            "LibreOfficeによるdocx→PDF変換が完了しているか確認してください。"
        )

    report_file = files[-1]
    print(f"📤 アップロード対象: {report_file}")

    # Google Drive 認証
    credentials_info = json.loads(service_account_json)
    creds = Credentials.from_service_account_info(
        credentials_info,
        scopes=["https://www.googleapis.com/auth/drive"]
    )
    service = build("drive", "v3", credentials=creds)

    # ファイル名（日付入り）
    today = datetime.now().strftime("%Y-%m-%d")
    file_name = f"マーケットレポート_{today}.pdf"

    # アップロード
    file_metadata = {
        "name": file_name,
        "parents": [folder_id],
        "mimeType": "application/pdf"
    }

    media = MediaFileUpload(report_file, mimetype="application/pdf")

    uploaded = service.files().create(
        body=file_metadata,
        media_body=media,
        fields="id, webViewLink"
    ).execute()

    file_id = uploaded.get("id")
    view_link = uploaded.get("webViewLink")

    print(f"✅ アップロード成功!")
    print(f"   ファイルID: {file_id}")
    print(f"   表示URL:   {view_link}")

    # メール送信スクリプト用にURLを保存
    link_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "drive_link.txt")
    with open(link_path, "w") as f:
        f.write(view_link)

    print(f"   drive_link.txt に保存しました")


if __name__ == "__main__":
    main()
