const loginButton = document.getElementById("loginButton")
const registerButtom = document.getElementById("registerButton")

const loginPage = document.getElementById("loginPage")

const accountPageScroll = document.getElementsByClassName("account-page-scroll")[0]

if (localUser == undefined)
{
    loginButton.addEventListener('click', () =>
    {
        // Change page to login
        if (!loginPage.classList.contains("hidden") && accountPageScroll.classList.contains("display-register"))
        {
            accountPageScroll.classList.remove("display-register")
            return
        }
        loginPage.classList.toggle("hidden")
        accountPageScroll.classList.add("no-transition")
        accountPageScroll.classList.remove("display-register")
        setTimeout(() =>
        {
            accountPageScroll.classList.remove("no-transition")
        }, 500)
    })
    registerButtom.addEventListener('click', () =>
    {
        // Change page to register
        if (!loginPage.classList.contains("hidden") && !accountPageScroll.classList.contains("display-register"))
        {
            accountPageScroll.classList.add("display-register")
            return
        }
        loginPage.classList.toggle("hidden")
        accountPageScroll.classList.add("no-transition")
        accountPageScroll.classList.add("display-register")
        setTimeout(() =>
        {
            accountPageScroll.classList.remove("no-transition")
        }, 500)
    })

    
}

