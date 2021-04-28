describe('My device page Test', () => {
    it('Visits the overview device page', () => {
        cy.visit('localhost:3000/login');
        cy.get('.action-register').click();
        cy.get('.action-login').click();

        // Get an email input, type into it and verify that the value has been updated
        cy.get('.action-email')
        .type('fake@email.com')
        .should('have.value', 'fake@email.com');
        
        // Get an password input, type into it and verify that the value has been updated
        cy.get('.action-password')
        .type('Ming#1359')
        .should('have.value', 'Ming#1359');
        cy.get('.action-submit').click();
        
        // When you login a test will be conducted to check if the user got a cookie.
        cy.getCookie('auth').should('have.property','value','608911a0070ea135f09e3705')

        cy.visit('localhost:3000/devices');
        cy.get('.add-device').click();
        cy.get('.name-input')
        .type('samsungtv')
        .should('have.value','samsungtv');

        cy.get('.energy-consumption')
        .type('136')
        .should('have.value','136');
        
        cy.get('.time-00').click();
        cy.get('.time-02').click();
        cy.get('.time-04').click();
        cy.get('.time-05').click();
        cy.get('.time-07').click();
        cy.get('.time-11').click();
        cy.get('.time-13').click();
        cy.get('.time-17').click();
        cy.get('.time-18').click();
        cy.get('.time-21').click();

        cy.get('.submit-device').click();
    });
});