# Wysebone

## Requirement
- Apache
- PostgreSQL
- Python

## Installations
```
pip install django
pip install psycopg2 (or pip install psycopg2-binary)
pip install django_compressor (or pip install git+https://github.com/django-compressor/django-compressor.git)
pip install django-rest-framework
pip install StringGenerator
pip install jsonmerge
pip install python-decouple
```

## Install project
- Clone source from Gitlab repository
  ```
  git clone http://10.20.10.20/development/wysebone.git /path/to/project
  ```
- Project configuration
  - Copy `.env.example` to `.env`
    ```
    cd /path/to/project
    cp .env.example .env
    ```
  - Config the project by setting default values in the `.env` file.
    ```
    nano .env
    ```
    ```env
    SECRET_KEY = '=4kr*c-fh#ed%e+qj5q_i&7czhpn#muqge#q%(*#bsa4n4(dl3'
    DEBUG = False

    # Database config
    DB_NAME =
    DB_USER =
    DB_PASSWORD =
    DB_HOST = 127.0.0.1

    # Email config
    EMAIL_HOST = smtp.dynastyle.jp
    EMAIL_PORT = 587
    EMAIL_HOST_PASSWORD =
    EMAIL_HOST_USER =
    EMAIL_USE_TLS = False
    ```
- Activate the virtual environment
  ```
  source path/to/env/bin/activate
  ```
- Run migrations to install the database
  ```
  python manage.py compilemessages
  python manage.py makemigrations
  python manage.py migrate
  python manage.py loaddata item_type.json
  python manage.py loaddata role.json
  ```
- Create the first super user
  ```
  python manage.py createsuperuser
  ```
- Congratulations. Log into the administrator account from uri: `/login`


## Update project
- Pull new source code from Gitlab repository.
  ```
  cd /path/to/project
  git stash
  git pull
  git stash pop
  ```
- Activate the virtual environment
  ```
  source path/to/env/bin/activate
  ```
- Run migrations
  ```
  python manage.py makemigrations
  python manage.py migrate
  ```

## Restart apache(httpd)
```
sudo service httpd restart
```

## How to config wsgi on httpd
```
sudo nano /etc/httpd/conf.d/django.conf
```

```conf
LoadModule wsgi_module /usr/lib64/httpd/modules/mod_wsgi.so

Alias /static /path/to/project/static
Alias /uploads /path/to/project/uploads

<Directory /path/to/project/static>
  Require all granted
</Directory>

<Directory /path/to/project/uploads>
  Require all granted
</Directory>

<Directory /path/to/project/system>
  <Files wsgi.py>
      Require all granted
  </Files>
</Directory>
WSGIDaemonProcess wysebone python-path=/path/to/project:/develop/projects/projectenv/lib/python3.7/site-packages
WSGIProcessGroup wysebone
WSGIScriptAlias / /path/to/project/system/wsgi.py
```
