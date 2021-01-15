

var apiUrl = "https://borc.tayran.online/";
var path = window.location.pathname;

//functions
function getAccessToken() {
    var loginDataJson = sessionStorage["login"] || localStorage["login"];
    var loginData;
    try {
        loginData = JSON.parse(loginDataJson)
    } catch (error) {
        window.location.href = "login.html";
        return null;
    }

    if (!loginData || !loginData.access_token) {
        window.location.pathname = "login.html";
        return null;
    }

    return loginData.access_token;
}

function getAuthHeaders() {
    return { Authorization: "Bearer " + getAccessToken() };
}

function loginControl() {
    if (path.endsWith("/login.html")) return;

    var accessToken = getAccessToken();

    if (!accessToken) {
        window.location.href = "login.html";
        return;
    }

    //token şuan elimizde ama geçerli mi ?
    $.ajax({
        type: "get",
        headers: getAuthHeaders(),
        url: apiUrl + "api/Account/UserInfo",
        success: function (data) {
            $("#loginAd").text(data.Email)
            borclariListele();
            $(".gizle").removeClass("gizle");
        },
        error: function () {
            window.location.pathname = "login.html";
        }
    });
}

$("#frmGiris").submit(function (event) {
    event.preventDefault();
    var frmGiris = this;

    $.ajax({
        type: "post",
        url: apiUrl + "Token",
        data: { grant_type: "password", username: $("#inputEmail").val(), password: $("#inputPassword").val() },

        success: function (data) {
            localStorage.removeItem("login");
            sessionStorage.removeItem("login");
            var hatirla = $("#rememberme").prop("checked"); //true | false
            var storage = hatirla ? localStorage : sessionStorage;
            storage["login"] = JSON.stringify(data);
            $("#basari").text("Giriş Başarılı.Anasayfaya Yönlendiriliyorsunuz..").show();
            setTimeout(function () {
                location.href = "./";
            }, 1000);
            frmGiris.reset();
        },
        error: function (xhr, status, error) {
            if (xhr.responseJSON.error == "invalid_grant") {
                $("#hata").text("Kullanıcı adı ya da parola yanlış !").show();
            }
        }
    });
});

function borclariListele() {
    $.ajax({
        type: "get",
        headers: getAuthHeaders(),
        url: apiUrl + "api/Borclar/Listele",
        success: function (data) {
            borclariTabloyaEkle(data);
        },
        error: function () {
        }
    });
}

function borclariTabloyaEkle(borclar) {
    for (var i = 0; i < borclar.length; i++) {
        borcuTabloyaEkle(borclar[i]);
    }
};

function borcuTabloyaEkle(borc) {
    var html = '<tr class="' + (borc.BorcluMuyum ? 'tarafAlacakli' : 'tarafBorclu') + '">' +
        '<td>' + borc.Taraf + '</td>' +
        '<td class="borcMiktarSutun">' + borc.BorcMiktar.toFixed(2) + '</td>' +
        '<td>' + tarihBicimlendir(borc.SonOdemeTarihi) + '</td>' +
        '<td>' + borcKapandiSwitch(borc.BorcKapandiMi, borc.Id) + '</td>' +
        '<td><a href="#" data-borc-sil-id="' + borc.Id + '"><i class="fas fa-trash"></i></a></td>' +
        '</tr>';
    $("#tblBorclar tbody").append(html);
}

function borcKapandiSwitch(borcKapandiMi, borcId) {
    return '<div class="custom-control custom-switch">'
        + '<input type="checkbox" class="custom-control-input" data-borc-switch-id="' + borcId + '" id="chkKapandi-' + borcId + '"' + (borcKapandiMi ? " checked" : "") + '>'
        + '<label class="custom-control-label" for="chkKapandi-' + borcId + '">Ödendi</label>'
        + '</div>'
}

//isoTarih:2020-12-31T23:59:59
function tarihBicimlendir(isoTarih) {
    if (!isoTarih) {
        return "Belirtilmedi";
    }
    var tarih = new Date(isoTarih);
    return tarih.toLocaleDateString();
}


$("#btnCikisYap").click(function (e) {
    e.preventDefault();
    localStorage.removeItem("login");
    sessionStorage.removeItem("login");
    window.location.pathname = "login.html"
});

$("#frmGiris").on("input", function () {
    $("#hata").hide();
});

$(document).ajaxStart(function () {
    $("#loading").removeClass("d-none");
});

$(document).ajaxStop(function () {
    $("#loading").addClass("d-none");
});

$("#frmBorc").submit(function (event) {
    event.preventDefault();
    var frm = this;
    $.ajax({
        type: "post",
        headers: getAuthHeaders(),
        url: apiUrl + "api/Borclar/Ekle",
        data: $(frm).serialize(),
        success: function (data) {
            borcuTabloyaEkle(data);
            toastr.success("Borç Eklendi");
        },
        error: function (xhr, status, error) {
            toastr.error("Borç Eklenirken Hata Oluştu");
        }
    });
});

$("body").on("change", "[data-borc-switch-id]", function (event) {
    var borcId = $(this).data("borc-switch-id");
    var borcKapandiMi = $(this).prop("checked");

    $.ajax({
        type: "put",
        headers: getAuthHeaders(),
        url: apiUrl + "api/Borclar/KapanmaDurumGuncelle/" + borcId,
        data: { BorcId: borcId, BorcKapandiMi: borcKapandiMi },
        success: function (data) {
            toastr.success("Borç durumu güncellendi");
        },
        error: function (xhr, status, error) {
            toastr.error("Borç durumu güncellenemedi");
        }

    })
});

$("#registerOpen").on("click", function () {
    $("#frmGiris").addClass("d-none");
    $("#frmRegister").removeClass("d-none")
    $("#inputEmailRegister").focus();
});

$("#loginOpen").on("click", function () {
    $("#frmRegister").addClass("d-none")
    $("#frmGiris").removeClass("d-none");
    $("#inputEmail").focus();
});

$("#frmRegister").submit(function (e) {
    e.preventDefault()
    var pwdReg = $("#inputPasswordRegister");
    var pwdRegConfirm = $("#inputPasswordRegisterDoğrula");
    $.ajax({
        type: "post",
        url: apiUrl + "api/Account/Register",
        data: { Email: $("#inputEmailRegister").val(), Password: pwdReg.val(), ConfirmPassword: pwdRegConfirm.val() },
        success: function (data) {
            toastr.success("Hesabınız başarıyla oluşturuldu");
            $("#frmRegister").addClass("d-none");
            $("#frmGiris").removeClass("d-none");
            $("#inputEmail").focus();
        },
        error: function () {
            if (pwdReg.val() != pwdRegConfirm.val()) {
                toastr.error("Parolonız eşleşmiyor...")
            }
            else {
                toastr.error("Hesap oluştururken bir hata oluştu");
            }
            pwdReg.val("");
            pwdRegConfirm.val("");
        }
    });
});

$("body").on("click", "[data-borc-sil-id]", function (e) {
    e.preventDefault();

    var silinecekBorcId = $(this).data("borc-sil-id");

    if (!confirm("Seçili borcu silmek istediğinizden emin misiniz ?")) {
        return false;
    };

    $.ajax({
        type:"Delete",
        headers:getAuthHeaders(),
        url:apiUrl + "api/Borclar/Delete?SilinecekBorcId=" + silinecekBorcId,
        data: {SilinecekBorcId : silinecekBorcId },
        success : function (data) {
            $("#tblBorclar tbody").html("");
            borclariListele(data);
            toastr.success("Seçili borç silindi");
        },
        error : function () {
            toastr.error("Borç silinirken hata oluştu");
        }
    })
});

loginControl();