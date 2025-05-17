import os
from dotenv import load_dotenv
load_dotenv()

from imgurpython import ImgurClient

client_id = os.getenv('client_id')
client_secret = os.getenv('client_secret')

client = ImgurClient(client_id, client_secret)

def get_image(img_id):
    if img_id is None:
        link = '/static/img/no-photos.png'
    else:
        link=f'https://i.imgur.com/{img_id}.png'
    return link

def get_images(album_id):
    alist = []
    if album_id is None:
        alist.append('/static/img/no-photos.png')
    else:
        items = client.get_album_images(album_id)
        for item in items:
            alist.append(item.link)

    return alist
