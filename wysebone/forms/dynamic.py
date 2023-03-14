from django import forms

class DjangoForm(forms.Form):
    def is_valid(self):
        ret = forms.Form.is_valid(self)
        for f in self.errors:
            self.fields[f].widget.attrs.update(
                {'class': self.fields[f].widget.attrs.get('class', '') + ' is-invalid'})
        return ret
