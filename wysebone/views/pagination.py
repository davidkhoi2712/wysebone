from wysebone import constants

class Pagination():
    # Is redirect uri
    is_redirect = False
    
    per_page    = constants.MIN_PER_PAGE
    page_number = 1
    
    def get_per_page(self, request):
        """Get per page from url
        
        Parameters
        ----------
        request: HttpRequest

        Version
        -------
        1.0.1

        Author
        ------
        Thanh Pham
        """
        
        try:
            self.per_page = int(request.GET.get('per_page', constants.MIN_PER_PAGE))
            if self.per_page not in constants.PER_PAGES:
                self.is_redirect = True
                self.per_page = constants.MIN_PER_PAGE
        except:
            self.is_redirect = True
            self.per_page = constants.MIN_PER_PAGE
            
    def get_page_number(self, request, paginator):
        """Get page number from url
    
        Parameters
        ----------
        request: HttpRequest
        paginator: django.core.paginator.Paginator

        Version
        -------
        1.0.1

        Author
        ------
        Thanh Pham
        """
        
        try:
            self.page_number = int(request.GET.get('page', 1))
            if self.page_number < 1:
                self.is_redirect = True
                self.page_number = 1
                
            if self.page_number > paginator.num_pages:
                self.is_redirect = True
                self.page_number = paginator.num_pages
        except:
            self.is_redirect = True
            self.page_number = 1
            
    def get_redirect_url(self, path):
        """Get redirect url
    
        Parameters
        ----------
        path: HttpRequest
        
        Returns
        -------
        new_path: str

        Version
        -------
        1.0.1

        Author
        ------
        Thanh Pham
        """
        
        return path + 'page=' + str(self.page_number) + '&per_page=' + str(self.per_page)