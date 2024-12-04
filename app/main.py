import cv2
import os
import zipfile
import tempfile
from flask import Flask, request, send_file, after_this_request
from werkzeug.utils import secure_filename

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
  return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_frames(video_path, output_folder, frame_interval=1):
  if not os.path.exists(output_folder):
    os.makedirs(output_folder)

  video = cv2.VideoCapture(video_path)
  try:
    fps = int(video.get(cv2.CAP_PROP_FPS))
    frame_count = 0

    while True:
      success, frame = video.read()
      if not success:
        break
      if frame_count % (fps * frame_interval) == 0:
        output_filename = f"{output_folder}/frame_{frame_count:06d}.jpg"
        cv2.imwrite(output_filename, frame)
      frame_count += 1
  finally:
    video.release()

@app.route('/', methods=['GET', 'POST'])
def upload_file():
  if request.method == 'POST':
    if 'file' not in request.files:
      return 'No file part'
    file = request.files['file']
    if file.filename == '':
      return 'No selected file'
    if file and allowed_file(file.filename):
      filename = secure_filename(file.filename)
      filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
      file.save(filepath)

      try:
        with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmpdirname:
          output_path = os.path.join(tmpdirname, filename.rsplit('.', 1)[0])
          extract_frames(filepath, output_path)

          zip_filename = f"{filename.rsplit('.', 1)[0]}_frames.zip"
          zip_path = os.path.join(tmpdirname, zip_filename)

          with zipfile.ZipFile(zip_path, 'w') as zipf:
            for root, _, files in os.walk(output_path):
              for file in files:
                file_path = os.path.join(root, file)
                zipf.write(file_path, arcname=file)
                os.remove(file_path)  # Remove each file after adding to zip

          @after_this_request
          def cleanup(response):
            try:
              os.remove(filepath)
            except Exception as e:
              app.logger.error(f"Error removing file {filepath}: {e}")
            return response

          return send_file(zip_path, as_attachment=True, download_name=zip_filename)
      except Exception as e:
          app.logger.error(f"Error processing video: {e}")
          return "An error occurred while processing the video", 500

  return '''
  <!doctype html>
  <title>Upload Video File</title>
  <h1>Upload Video File</h1>
  <form method=post enctype=multipart/form-data>
    <input type=file name=file>
    <input type=submit value=Upload>
  </form>
  '''

if __name__ == '__main__':
  os.makedirs(UPLOAD_FOLDER, exist_ok=True)
  app.run(debug=True)