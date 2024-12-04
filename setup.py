from setuptools import setup, find_packages

setup(
    name="VideoFrameExtractor",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "opencv-python",
    ],
    entry_points={
        'console_scripts': [
            'videoframeextractor=videoframeextractor.main:main',
        ],
    },
    author="Santiago Vazquez Villarreal",
    author_email="santiago.vqz@gmail.com",
    description="A simple application to extract frames from a video file",
    long_description=open('README.md').read(),
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/VideoFrameExtractor",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)