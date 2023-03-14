from django.utils import formats, timezone
from wysebone import auths
import pytz
import datetime


def locale_to_db(date_string):
    """Date format from locale to database(%Y-%m-%d)

    Parameters
    ----------
    date_string : str
        date string

    Returns
    -------
    Date string

    Version
    -------
    1.0.0

    Author
    ------
    Khoi Pham
    """
    if date_string is None or date_string == '':
        return None

    input_formats = formats.get_format_lazy('DATETIME_INPUT_FORMATS')

    for format in input_formats:
        try:
            datetime_obj =  datetime.datetime.strptime(date_string, format)
        except :
            continue

    if str(datetime_obj.time())=="00:00:00":        
        datetime_obj = datetime.datetime.combine(datetime_obj.date(), datetime.datetime.now().time())

    return timezone.make_aware(datetime_obj)


def get_input_formats():
    """Get input format for DateField

    Returns
    -------
    format_date string

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    return ['%Y/%m/%d', '%d/%m/%Y', '%m/%d/%Y', '%Y-%m-%d']