from tethys_sdk.base import TethysAppBase, url_map_maker


class SmaAfrica(TethysAppBase):
    """
    Tethys app class for SMA Africa.
    """

    name = 'SMA Africa'
    index = 'sma_africa:home'
    icon = 'sma_africa/images/logo.png'
    package = 'sma_africa'
    root_url = 'sma-africa'
    color = '#c0392b'
    description = 'Place a brief description of your app here.'
    tags = 'Land Cover'
    enable_feedback = False
    feedback_emails = []

    def url_maps(self):
        """
        Add controllers
        """
        UrlMap = url_map_maker(self.root_url)

        url_maps = (
            UrlMap(
                name='home',
                url='sma-africa',
                controller='sma_africa.controllers.home'
            ),
            UrlMap(
                name='get-plot',
                url='sma-africa/get-plot',
                controller='sma_africa.ajax_controllers.get_plot'
            ),
        )

        return url_maps
