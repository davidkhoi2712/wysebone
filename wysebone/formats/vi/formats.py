SHORT_DATETIME_FORMAT = "d/m/Y H:i:s"
DATE_INPUT_FORMATS = ['%d/%m/%Y']
DATETIME_INPUT_FORMATS = [
    '%d/%m/%Y %H:%M:%S',     # '25-10-2016 14:30:59'
    '%d/%m/%Y %H:%M:%S.%f',  # '25-10-2016 14:30:59.000200'
    '%d/%m/%Y %H:%M',        # '25-10-2016 14:30'
    '%d/%m/%Y',              # '25-10-2016'
]